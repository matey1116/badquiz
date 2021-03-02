var captcha_token;

function recaptcha(){
    grecaptcha.ready(function () {
        grecaptcha.execute('6LdytZwUAAAAAAsgfy7elPonBGTbd-P-Yb-t1pG8', {
            action: 'homepage'
        }).then(function (token) {
            captcha_token = token;
        });
    });
}