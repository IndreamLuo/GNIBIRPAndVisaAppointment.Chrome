var binding = {
    inputs: [],

    initialize: function () {
        var $inputs = $('input, select');
        $inputs.each(function () {
            binding.inputs.push(this);

            var dependOn = eval(this.getAttribute('depend-on'));
            dependOn
            && (binding.setDependOn(this, dependOn) || true)
            || this.nodeName == 'SELECT' && binding.setSelectOptions(this);
        });
    },

    setDependOn: function (input, dependOn) {
        input.disabled = 'disabled';
        var select = input.nodeName == 'SELECT' && input;
        $(dependOn).change(function () {
            var validWhen = eval(input.getAttribute('valid-when'));

            if (validWhen) {
                input.disabled = null;
                select && binding.setSelectOptions(select);
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
       for (var index in binding.inputs) {
           var input = binding.inputs[index];
           
       }
   }
}

$(document).ready(function () {
    binding.initialize();

    $('.buttons .save').click(function () {

    });
});