(function () {
    "use strict";

    function markCurrentPage() {
        var currentPage = window.location.pathname.split("/").pop() || "index.html";

        document.querySelectorAll("[data-silk-nav]").forEach(function (link) {
            var target = (link.getAttribute("href") || "").split("#")[0];
            if (target === currentPage) {
                link.classList.add("active");
                link.setAttribute("aria-current", "page");
            }
        });
    }

    function wireStaticForms() {
        document.querySelectorAll("form.needs-validation").forEach(function (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();

                if (!form.checkValidity()) {
                    form.classList.add("was-validated");
                    return;
                }

                var values = [];
                new FormData(form).forEach(function (value, key) {
                    if (key !== "action" && typeof value === "string" && value.trim()) {
                        values.push(key + ": " + value.trim());
                    }
                });

                var action = form.querySelector("[name=action]");
                var actionName = action ? action.value : "contact";
                var subject = actionName === "appointment"
                    ? "SILK Homes availability request"
                    : actionName === "subscribe"
                        ? "SILK Homes journal updates"
                        : "SILK Homes inquiry";
                var body = values.length ? values.join("\n") : "I would like to connect with SILK Homes.";
                var status = form.querySelector(".silk-form-status");

                if (status) {
                    status.hidden = false;
                    status.textContent = "Opening your email app so you can send this request to info@silkhomes.org.";
                }

                window.location.href = "mailto:info@silkhomes.org?subject="
                    + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
            }, true);
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        markCurrentPage();
        wireStaticForms();
    });
})();
