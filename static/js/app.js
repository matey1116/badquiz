const navSlide = () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    burger.addEventListener('click', () => {
        nav.classList.toggle('nav-active');

        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            }
            else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.25}s`;
            }
        });

        burger.classList.toggle('toggle');

    });
}

const logout = () => {
    request = $.ajax({
        url: "/API/logout",
        type: "post",
        // data: serializedData + "&btnLogin=1"
    });

    // Callback handler that will be called on success
    request.done(function (response, textStatus, jqXHR) {
        // Log a message to the console
        if (response == 0) {
            window.location.href = "/";
        }
    });

    // Callback handler that will be called on failure
    request.fail(function (jqXHR, textStatus, errorThrown) {
        // Log the error to the console
        alert(
            "The following error occurred: " +
            textStatus, errorThrown
        );
    });
}

$("#highscoresBtn").click(function () {
    $('html,body').animate({
        scrollTop: $(".container1").offset().top
    },
        'slow');
});


$(".logo").click(function () {
    window.location.href = "/";
});



navSlide(); 