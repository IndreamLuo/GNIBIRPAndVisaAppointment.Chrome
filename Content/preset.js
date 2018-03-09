var binding = {
    inputs: [],

    initialize: function () {
        binding.formType = $('.form').attr('form-type');

        var $inputs = $('input, select');

        $inputs.each(function () {
            binding.inputs.push(this);

            var dependee = eval(this.getAttribute('dependee'));

            dependee
            && (binding.setDependee(this, dependee) || true)
            || this.nodeName == 'SELECT' && binding.setSelect(this)
            || binding.setInput(this);

            binding.calculateValue(this);
        });
    },

    setSelect: function (select) {
        binding.setSelectOptions(select);
    },

    setInput: function (input) {
        if (input.type == 'checkbox') {
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

    calculateValue: function (input) {
        input.value = input.value || eval(input.getAttribute('calculated-value'));
    },

    setDependee: function (input, dependee) {
        input.disabled = 'disabled';
        var select = input.nodeName == 'SELECT' && input;
        $(dependee).change(function () {
            var validWhen = eval(input.getAttribute('valid-when'));

            if (validWhen || validWhen == null) {
                input.disabled = null;
                select && binding.setSelectOptions(select);
                binding.calculateValue(input);
            } else {
                input.disabled = 'disable';
            }
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

        var currentDependants = binding.inputs;
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
                    value: dependant.value
                })
                && (marks[dependant.id] = true)
                || newDependants.push(dependant);
            }

            currentDependants = newDependants;
        }

        return data;
    },
   
    save: function () {
        var data = binding.collectData();
        var update = {};
        var key = binding.formType + '-form-preset';
        update[key] = data;
        chrome.storage.local.set(update, function () {
            //
        });
    }
}

$(document).ready(function () {
    binding.initialize();

    $('.buttons .save').click(function () {
        binding.save();
    });
});