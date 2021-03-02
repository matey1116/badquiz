var googleUser = {};

var startApp = function () {
    gapi.load('auth2', function () {
        // Retrieve the singleton for the GoogleAuth library and set up the client.
        auth2 = gapi.auth2.init({
            client_id: '820226875616-ae9qglnqgh31nnom4ml9ker1sqk2adn8.apps.googleusercontent.com',
            cookiepolicy: 'single_host_origin',
            // Request scopes in addition to 'profile' and 'email'
            //scope: 'additional_scope'
        });
        attachSignin(document.getElementById('btn-google'));
    });
};

function attachSignin(element) {
    auth2.attachClickHandler(element, {},
        function (googleUser) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/API/google_sign');
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.onload = function () {
                if (xhr.responseText.trim() != '-1') {
                    document.location.href = '/';
                }
            };
            xhr.send('idtoken=' + googleUser.getAuthResponse().id_token);
        }, function (error) {
            alert(JSON.stringify(error, undefined, 2));
        });
};

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};


(function ($) {
    "use strict";


    /*==================================================================
    [ Validate ]*/

    var input = $('.validate-input .input100');
    $('.validate-form').on('submit', function (event) {
        var request;
        var check = true;

        $('.validate-form .input100').each(function () {
            hideValidate(this);
            hideError(this);
            hideNoMatch(this);
        });

        for (var i = 0; i < input.length; i++) {
            if (validate(input[i]) == false) {
                showValidate(input[i]);
                check = false;
            }
        }

        if (check == false) {
            return false;
        }
        else {
            //check captcha

            // Prevent default posting of form - put here to work in case of errors
            event.preventDefault();
            // Abort any pending request
            if (request) {
                request.abort();
            }
            // setup some local variables
            var $form = $(this);

            // Let's select and cache all the fields
            var $inputs = $form.find("input, select, button, textarea");

            // Serialize the data in the form
            var serializedData = $form.serialize();

            // Let's disable the inputs for the duration of the Ajax request.
            // Note: we disable elements AFTER the form data has been serialized.
            // Disabled form elements will not be serialized.
            $inputs.prop("disabled", true);

            if (document.getElementById("btnLogin") != null) {
                // Fire off the request to /form.php
                request = $.ajax({
                    url: "/API/login",
                    type: "post",
                    data: serializedData + "&btnLogin=1"
                });

                // Callback handler that will be called on success
                request.done(function (response, textStatus, jqXHR) {
                    // Log a message to the console
                    if (response > 0) {
                        window.location.href = "/";
                    }
                    else if (response.trim() === "pass") {
                        showError(document.getElementById("passin"));
                        document.getElementById("passin").value = "";
                    }
                    else if (response.trim() === "user") {
                        document.getElementById("userin").value = "";
                        document.getElementById("passin").value = "";
                        showError(document.getElementById("userin"));
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

                // Callback handler that will be called regardless
                // if the request failed or succeeded
                request.always(function () {
                    // Reenable the inputs
                    $inputs.prop("disabled", false);
                });
            }
            else if (document.getElementById("btnCngPass") != null && document.getElementById("hiddenBase") != null) {
                if (validEmail(document.getElementById('emailin').value) == false) {
                    showError(document.getElementById("emailin"));
                    $inputs.prop("disabled", false);
                }
                else {
                    // Fire off the request to /form.php
                    request = $.ajax({
                        url: "/API/forgot_pass",
                        type: "post",
                        data: serializedData + "&btnCngPass=1"
                    });

                    // Callback handler that will be called on success
                    request.done(function (response, textStatus, jqXHR) {
                        // Log a message to the console
                        //alert("email sent");
                        document.getElementById("emailSpan").textContent = "The email with password recovery instructions has been sent to " + document.getElementById('emailin').value + ". The recovery link inside the email is valid for 24 hours!";
                        document.getElementById("emailinDiv").style.display = 'none';
                        document.getElementById("btnCngPassDiv").style.display = 'none';

                    });

                    // Callback handler that will be called on failure
                    request.fail(function (jqXHR, textStatus, errorThrown) {
                        // Log the error to the console
                        alert(
                            "The following error occurred: " +
                            textStatus, errorThrown
                        );
                    });

                    // Callback handler that will be called regardless
                    // if the request failed or succeeded
                    request.always(function () {
                        // Reenable the inputs
                        $inputs.prop("disabled", false);
                    });
                }
            }

            else if (document.getElementById("btnCngPass") != null && document.getElementById("hiddenPass") != null) {
                if (document.getElementById('passin').value.trim() != document.getElementById('passinrep').value.trim()) {
                    showNoMatch(document.getElementById('passin'));
                    showNoMatch(document.getElementById('passinrep'));
                    $inputs.prop("disabled", false);
                }
                else {
                    if (validatePassword(document.getElementById('passin').value.trim()) == false) {
                        showError(document.getElementById('passin'));
                        showError(document.getElementById('passinrep'));
                        $inputs.prop("disabled", false);
                    }
                    else {
                        // console.log(getUrlParameter('uid'));
                        // Fire off the request to /form.php
                        request = $.ajax({
                            url: "/API/forgot_pass",
                            type: "post",
                            data: serializedData + "&uid=" + getUrlParameter('uid')
                        });

                        // Callback handler that will be called on success
                        request.done(function (response, textStatus, jqXHR) {
                            if (response == 0) {
                                document.getElementById("passinDiv").style.display = 'none';
                                document.getElementById("passinrepDiv").style.display = 'none';
                                document.getElementById("newPassDiv").style.display = 'none';
                                document.getElementById("passInfoDiv").style.display = 'none';
                                document.getElementById("newPassRepDiv").style.display = 'none';
                                document.getElementById("btnCngPassDiv").style.display = 'none';
                                document.getElementById("notaMemDiv").style.display = 'none';
                                document.getElementById("HeadSpan").textContent = "Your password has been successfully changed. You will be redirected to the login page in 5 seconds...";
                                window.setTimeout(function () {

                                    // Move to a new location or you can do something else
                                    window.location.href = "/login";

                                }, 5000);

                            }
                            else if (response.trim() === "invalid") {
                                showError(document.getElementById('passin'));
                                showError(document.getElementById('passinrep'));
                                $inputs.prop("disabled", false);
                            }
                            else if (response.trim() === "missmatch") {
                                showNoMatch(document.getElementById('passin'));
                                showNoMatch(document.getElementById('passinrep'));
                                $inputs.prop("disabled", false);
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

                        // Callback handler that will be called regardless
                        // if the request failed or succeeded
                        request.always(function () {
                            // Reenable the inputs
                            $inputs.prop("disabled", false);
                        });
                    }
                }
            }

            else if (document.getElementById("btnReg") != null) {
                if (validEmail(document.getElementById('emailin').value) == false) {
                    showError(document.getElementById("emailin"));
                    $inputs.prop("disabled", false);
                }
                if (document.getElementById('passin').value.trim() != document.getElementById('passrepin').value.trim()) {
                    showNoMatch(document.getElementById('passin'));
                    showNoMatch(document.getElementById('passrepin'));
                    $inputs.prop("disabled", false);
                }
                else {
                    if (validatePassword(document.getElementById('passin').value.trim()) == false) {
                        showError(document.getElementById('passin'));
                        showError(document.getElementById('passrepin'));
                        $inputs.prop("disabled", false);
                    }
                    else {
                        // console.log(getUrlParameter('uid'));
                        // Fire off the request to /form.php
                        request = $.ajax({
                            url: "/API/register",
                            type: "post",
                            data: serializedData + "&btnReg=1"
                        });

                        // Callback handler that will be called on success
                        request.done(function (response, textStatus, jqXHR) {
                            if (response == 0) {
                                document.getElementById("passinDiv").style.display = 'none';
                                document.getElementById("passinrepDiv").style.display = 'none';
                                document.getElementById("passInfoDiv").style.display = 'none';
                                document.getElementById("btnRegDiv").style.display = 'none';
                                document.getElementById("alreadyMem").style.display = 'none';
                                document.getElementById("facebook").style.display = 'none';
                                document.getElementById("btn-google").style.display = 'none';
                                document.getElementById("emaildiv").style.display = 'none';
                                document.getElementById("emailinfoDiv").style.display = 'none';
                                document.getElementById("passinfodiv1").style.display = 'none';
                                document.getElementById("passrepdiv").style.display = 'none';
                                document.getElementById("fnamediv").style.display = 'none';
                                document.getElementById("fnameinfoDiv").style.display = 'none';
                                document.getElementById("lnamediv").style.display = 'none';
                                document.getElementById("lnameinfoDiv").style.display = 'none';

                                document.getElementById("HeadSpan").textContent = "Your account has successfully been created. You will be redirected to the login page in 5 seconds...";
                                window.setTimeout(function () {

                                    // Move to a new location or you can do something else
                                    window.location.href = "/login";

                                }, 5000);

                            }
                            else if (response.trim() === "email") {
                                showError(document.getElementById("emailin"));
                            }
                            else if (response.trim() === "password") {
                                showError(document.getElementById('passin'));
                                showError(document.getElementById('passinrep'));
                            }
                            else if (response.trim() === "exists") {
                                showTaken(document.getElementById('emailin'));
                                $inputs.prop("disabled", false);
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

                        // Callback handler that will be called regardless
                        // if the request failed or succeeded
                        request.always(function () {
                            // Reenable the inputs
                            $inputs.prop("disabled", false);
                        });
                    }
                }
            }
        }
    });


    $('.validate-form .input100').each(function () {
        $(this).focus(function () {
            hideValidate(this);
            hideError(this);
            hideNoMatch(this);
            hideTaken(this);
        });
    });

    function validate(input) {
        if ($(input).val().trim() == '') {
            return false;
        }
    }

    function showValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('alert-validate');
    }

    function showError(input) {
        var thisAlert = $(input).parent();
        $(thisAlert).addClass('alert-error');
    }

    function hideError(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('alert-error');
    }

    function showNoMatch(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).addClass('nomatch');
    }

    function showTaken(input) {
        var thisAlert = $(input).parent();
        $(thisAlert).addClass('taken');
    }

    function hideTaken(input) {
        var thisAlert = $(input).parent();
        $(thisAlert).removeClass('taken');
    }


    function hideNoMatch(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('nomatch');
    }

    function validEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    };

    function validatePassword(pass) {
        if (pass.length < 8) {
            return false;
        }

        var num = /[0-9]/;
        var capLetter = /[A-Z]/;
        var lowLetter = /[a-z]/;

        if (num.test(pass) && capLetter.test(pass) && lowLetter.test(pass)) {
            return true;
        }
        else {
            return false;
        }
    }
})(jQuery);