var tutorial = {
    initialized: false,

    $tutorial: null,
    $top: null,
    $bottom: null,
    $left: null,
    $right: null,
    $description: null,
    $next: null,
    $done: null,

    initialize: function () {
        if (!tutorial.initialized) {
            tutorial.initialized = true;

            tutorial.$tutorial = $('<div></div>').addClass('tutorial');

            tutorial.$top = $('<div></div>').addClass('tutorial-bg tutorial-bg-top');
            tutorial.$left = $('<div></div>').addClass('tutorial-bg tutorial-bg-left');
            tutorial.$right = $('<div></div>').addClass('tutorial-bg tutorial-bg-right');
            tutorial.$bottom = $('<div></div>').addClass('tutorial-bg tutorial-bg-bottom');

            tutorial.$description = $('<div></div>').addClass('fixed-bottom description');
            
            tutorial.$next = $('<button>Next</button>')
                .addClass('btn btn-success next')
                .click(tutorial.next);
            
            tutorial.$finish = $('<button>Finish</button>')
                .addClass('btn btn-danger finish')
                .click(tutorial.finish);

            tutorial.$tutorial
                .append(tutorial.$top)
                .append(tutorial.$left)
                .append(tutorial.$right)
                .append(tutorial.$bottom)
                .append(tutorial.$description)
                .append(tutorial.$next)
                .append(tutorial.$finish);

            $('body').append(tutorial.$tutorial);
        }
    },

    script: null,
    slideIndex: null,

    play: function (script) {
        tutorial.script = script;

        if (!script.slides.length) {
            return;
        }

        tutorial.$finish.hide();
        tutorial.$next.show();

        tutorial.$tutorial.fadeIn('fast', function () {
            tutorial.$description.slideDown('slow');
        });
        tutorial.slides = script.slides;
        tutorial.slideIndex = -1;
        tutorial.next();
    },

    next: function () {
        tutorial.slideIndex++;
        if (tutorial.slideIndex >= tutorial.slides.length - 1) {
            tutorial.$next.hide();
            tutorial.$finish.show();
        }

        var slide = tutorial.slides[tutorial.slideIndex];

        tutorial.$description.html(slide.description);

        var position = slide.$item.offset();
        var height = slide.$item.height()
            + parseFloat(slide.$item.css('paddingTop').replace('px', ''))
            + parseFloat(slide.$item.css('paddingBottom').replace('px', ''))
            + parseFloat(slide.$item.css('borderTop').replace('px', ''))
            + parseFloat(slide.$item.css('borderBottom').replace('px', ''));
        var width = slide.$item.width()
            + parseFloat(slide.$item.css('paddingLeft').replace('px', ''))
            + parseFloat(slide.$item.css('paddingRight').replace('px', ''))
            + parseFloat(slide.$item.css('borderLeft').replace('px', ''))
            + parseFloat(slide.$item.css('borderRight').replace('px', ''));

        var top = position.top;
        var bottom = position.top + height;
        var left = position.left;
        var right = position.left + width;
        var animateDuration = 800;
        
        var focusOnItem = function () {
            tutorial.$top.animate({
                height: top
            }, {
                duration: animateDuration
            });
            tutorial.$left.animate({
                top: top,
                height: height,
                width: left
            }, {
                duration: animateDuration
            });
            tutorial.$right.animate({
                top: top,
                height: height,
                left: right
            }, {
                duration: animateDuration
            });
            tutorial.$bottom.animate({
                top: bottom
            }, {
                duration: animateDuration
            });
        }

        var fixedFocusOnItem = function () {
            $('.tutorial .tutorial-bg').addClass('.tutorial-fixed');
            var scrollTop = $(document.body).scrollTop();
            var fixedDuration = animateDuration;
            if (scrollTop > 300) {
                fixedDuration = (animateDuration = animateDuration / 2);
            }
            $(document.body).animate({
                scrollTop: 0
            }, {
                duration: fixedDuration,
                complete: function () {
                    position = slide.$item.offset();
                    top = position.top;
                    bottom = position.top + height;
                    focusOnItem();
                }
            });
        }
        
        $('.tutorial .tutorial-bg').removeClass('.tutorial-fixed');
        if (slide.fixed) {
            fixedFocusOnItem();
        } else {
            $(document.body).animate({
                scrollTop: top - 200
            }, {
                duration: animateDuration
            });
            focusOnItem();
        }
    },

    finish: function () {
        tutorial.$description.slideUp('fast', function () {
            tutorial.$tutorial.fadeOut('slow');
        });
    }
}