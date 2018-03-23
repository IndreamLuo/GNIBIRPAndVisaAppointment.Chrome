var preset = {
    inputs: [],

    initialize: function () {
        if ($('.form').attr('is-preset')) {
            preset.initializePreset();
    
            $('.buttons .save').click(function () {
                preset.save();
            });
    
            $('.buttons .clear').click(function () {
                preset.clear();
            });
        } else if (typeof presetFormType != 'undefined') {
            preset.initializeAppointment();
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
        preset.formType = presetFormType;
        preset.storageKey = preset.formType + '-form-preset';
        
        preset.resumeForm(true, function () {
            autoForm.complete();
        });

        formAssistant.applyScript('$(document.body).animate({ scrollTop: $(document).height() }, "slow");');
    },

    resumeForm: function (isAppointment, callback) {
        formStorage.retrieve(preset.storageKey, function (formData) {
            for (var index in formData) {
                var inputData = formData[index];
                if (isAppointment && inputData.inAppointment || !isAppointment) {
                    var input = document.getElementById(inputData.id);

                    preset.isButton(input)
                    ? (isAppointment
                        ? formAssistant.applyScript('$(' + input.id + ').click();')
                        : $(input).click())
                    : ((preset.isCheckbox(input) && (input.checked = !preset.isValuedCheckbox(input) ? inputData.value : input.getAttribute('checked-value') == inputData.value)
                        || (input.value = inputData.value)) || true)
                        && (isAppointment
                            ? formAssistant.applyScript('$(' + input.id + ').change();')
                            : $(input).change());
                }
            }

            callback && callback();
        });
    },

    setSelect: function (select) {
        preset.setSelectOptions(select);
    },

    setInput: function (input) {
        if (preset.isCheckbox(input)) {
            var checkedValue = input.getAttribute('checked-value');
            var uncheckedValue = input.getAttribute('unchecked-value');

            var setCheckboxValue = function (input, checkedValue, uncheckedValue) {
                input.value = input.checked && checkedValue || uncheckedValue;
            };

            setCheckboxValue(input, checkedValue, uncheckedValue);

            $(input).change(function () {
                setCheckboxValue(this, checkedValue, uncheckedValue);
            });
        }
    },

    isCheckbox: function (input) {
        return input.nodeName == 'INPUT' && input.type == 'checkbox';
    },

    isValuedCheckbox: function (input) {
        return preset.isCheckbox(input) && input.hasAttribute('checked-value') && input.hasAttribute('unchecked-value');
    },

    isButton: function (input) {
        return input.nodeName == 'BUTTON' || input.nodeName == 'INPUT' && input.type == 'button';
    },

    calculateValue: function (input) {
        input.value = eval(input.getAttribute('calculated-value'));
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
                    value: (preset.isCheckbox(dependant) && !preset.isValuedCheckbox(dependant))
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
   
    save: function () {
        var data = preset.collectData();
        formStorage.save(preset.storageKey, data, function () {
            //
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