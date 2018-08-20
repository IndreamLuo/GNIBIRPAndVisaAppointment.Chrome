var preset = {
    isInitialized: false,

    inputs: [],

    initialize: function () {
        if (!preset.isInitialized) {
            preset.isInitialized = true;

            if ($('.form').attr('is-preset')) {
                preset.initializePreset();
        
                $('.buttons .save').click(function () {
                    var clicked = this;
                    preset.save(function () {
                        preset.presets && (delete preset.presets[preset.formType]);

                        var backgroundPage = chrome.extension.getBackgroundPage();
                        if (backgroundPage) {
                            backgroundPage.preset.presets && (delete backgroundPage.preset.presets[preset.formType]);
                        }

                        if ($('.form').attr('form-save')) {
                            eval($('.form').attr('form-save'));
                        }
                        else
                        {
                            window.location.href = clicked.getAttribute('href');
                        }
                    });

                    return false;
                });
        
                $('.buttons .clear').click(function () {
                    preset.clear();
                });
            } else if (typeof autoForm != 'undefined') {
                preset.initializeAppointment();
            }
        }
    },

    initializePreset: function () {
        preset.formType = $('.form').attr('form-type');
        preset.storageKey = preset.formType + '-form-preset';

        var $inputs = $('input, select');

        var setupCount = $inputs.length;
        $inputs.each(function () {
            preset.inputs.push(this);
            
            var dependee = eval(this.getAttribute('dependee'));

            this.hasAttribute('preload-source') && preset.setSelect(this);
            
            dependee
            && (preset.setDependee(this, dependee) || true)
            || this.nodeName == 'SELECT' && (preset.setSelect(this) || true)
            || preset.setInput(this);

            preset.updateValue(this);

            if (!--setupCount) {
                var url = new URL(window.location.href);
                if (!url.searchParams.get('clear')) {
                    preset.resumeForm(false);
                }
            }
        });
    },

    initializeAppointment: function () {
        autoForm.onTimeSet(function () {
            preset.formType = autoForm.presetFormType;
            preset.storageKey = preset.formType + '-form-preset';
            
            preset.resumeForm(true, function (set) {
                set && formAssistant.applyScript('$(document.body).animate({ scrollTop: $(document).height() }, "slow");');
                autoForm.complete();
            });
        });
    },

    resumeForm: function (isAppointment, callback) {
        formStorage.retrieve(preset.storageKey, function (formData) {
            for (var index in formData) {
                var inputData = formData[index];
                if (isAppointment && inputData.inAppointment || !isAppointment) {
                    var input = document.getElementById(inputData.id);

                    if (preset.isButton(input)) {
                        isAppointment
                        ? formAssistant.applyScript('$(' + input.id + ').click();')
                        : $(input).click();
                    } else {
                        if (preset.isCheckbox(input)) {
                            input.checked = !preset.isValuedCheckbox(input) ? inputData.value : input.getAttribute('checked-value') == inputData.value;
                        } else if (preset.isRadio(input)) {
                            input.checked = (typeof inputData.value != 'undefined') ? inputData.value : input.checked;
                        } else {
                            input.value = inputData.value
                        }
                        
                        isAppointment
                        ? formAssistant.applyScript('$(' + input.id + ').change();')
                        : $(input).change()
                    }
                }
            }

            callback && callback(formData ? true : false);
        });
    },

    setSelect: function (select) {
        preset.setSelectOptions(select);
    },

    setCheckboxValue: function (input, checkedValue, uncheckedValue) {
        input.value = input.checked && checkedValue || uncheckedValue;
    },

    setInput: function (input) {
        if (preset.isCheckbox(input)) {
            var checkedValue = input.getAttribute('checked-value');
            var uncheckedValue = input.getAttribute('unchecked-value');

            preset.setCheckboxValue(input, checkedValue, uncheckedValue);

            $(input).change(function () {
                preset.setCheckboxValue(this, checkedValue, uncheckedValue);
            });
        }
    },

    isCheckbox: function (input) {
        return input.nodeName == 'INPUT' && input.type == 'checkbox';
    },

    isRadio: function (input) {
        return input.nodeName == 'INPUT' && input.type == 'radio';
    },

    isValuedCheckbox: function (input) {
        return preset.isCheckbox(input) && input.hasAttribute('checked-value') && input.hasAttribute('unchecked-value');
    },

    isButton: function (input) {
        return input.nodeName == 'BUTTON' || input.nodeName == 'INPUT' && input.type == 'button';
    },

    calculateValue: function (input) {
        input.value = input.hasAttribute('calculated-value')
        ? eval(input.getAttribute('calculated-value'))
        : input.value;
    },

    updateValue: function (input) {
        var select = input.nodeName == 'SELECT' && input;
        var validWhen = eval(input.getAttribute('valid-when'));

        if (validWhen || validWhen == null) {
            input.disabled = null;
            select && preset.setSelectOptions(select);
            preset.calculateValue(input);
        } else {
            input.hasAttribute('always-calculate') && preset.calculateValue(input);
            input.disabled = 'disable';
        }
    },

    setDependee: function (input, dependee) {
        input.disabled = 'disabled';
        $(dependee).change(function () {
            preset.updateValue(input);
        });
    },

    setSelectOptions: function (select) {
        var source = eval(select.getAttribute('source'));
        
        if (source != select.source) {
            var currentValue = select.value;
            select.options.length = 0;

            var addOptionToSelect = function (value, text) {
                var option = document.createElement('option');
                option.value = value;
                option.text = text;
                select.appendChild(option);
            }

            addOptionToSelect('', select.getAttribute('unselected-text') || '...');

            for (var key in source) {
                var value = source[key];
                Array.isArray(value) && (value = key);
                addOptionToSelect(value, value);
                value == currentValue && (select.value = currentValue)
            }

            select.source = source;
        }
    },

    collectData: function () {
        var data = [];
        var marks = {};
        var dependants = [];

        var currentDependants = preset.inputs;
        while (Object.keys(currentDependants).length) {
            var newDependants = [];

            for (var dependantIndex in currentDependants) {
                var dependant = currentDependants[dependantIndex];

                var dependees = eval(dependant.getAttribute('dependee'));
                dependees = dependees && !Array.isArray(dependees) && [dependees];

                (!dependees || (function () {
                    var allDependees = dependees.length;

                    for (var onIndex in dependees) {
                        var dependee = dependees[onIndex];
                        
                        marks[dependee.id]
                        && allDependees--;
                    }

                    return !allDependees;
                })())
                && data.push({
                    id: dependant.id,
                    value: (preset.isCheckbox(dependant) && !preset.isValuedCheckbox(dependant) || preset.isRadio(dependant))
                        ? dependant.checked
                        : dependant.value,
                    inAppointment: !dependant.hasAttribute('not-in-appointment')
                })
                && (marks[dependant.id] = true)
                || newDependants.push(dependant);
            }

            currentDependants = newDependants;
        }

        return data;
    },

    getPreset: function (callback) {
        preset.presets
        && preset.presets.irp && preset.presets.irp.loaded
        && preset.presets.visa && preset.presets.visa.loaded
        && preset.presets.notification && preset.presets.notification.loaded
        ? callback(preset.presets)
        : (function () {
            if (!preset._getPresetCallbacks || !preset._getPresetCallbacks.length) {
                preset._getPresetCallbacks = [callback];
                preset.presets = {};

                var retrieveData = function (key, callback) {
                    preset.presets[key] = {};
                    formStorage.retrieve(key + '-form-preset', function (data) {
                        if (data) {
                            data.forEach(inputData => {
                                preset.presets[key][inputData.id] = inputData.value;
                            });
                            preset.presets[key].loaded = true;
                        }
                        callback();
                    });
                };

                retrieveData('irp', function () {
                    retrieveData('visa', function () {
                        retrieveData('notification', function () {
                            var callback;
                            while (callback = preset._getPresetCallbacks.shift()) {
                                callback(preset.presets);
                            }
                        });
                    });
                });
            } else {
                preset._getPresetCallbacks.push(callback);
            }
        }());
    },
   
    save: function (callback) {
        var data = preset.collectData();
        formStorage.save(preset.storageKey, data, function () {
            notification.resubscribe();
            callback && callback();
        });
    },

    clear: function () {
        var url = new URL(window.location.href);
        url.searchParams.set('clear', 'true');
        window.location.href = url;
    }
}

$(document).ready(function () {
    preset.initialize();
});