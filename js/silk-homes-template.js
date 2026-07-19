(function () {
    "use strict";

    function pageKey(pathname) {
        var path = pathname.replace(/\/+/g, "/");
        if (path.length > 1 && path.charAt(path.length - 1) === "/") {
            path = path.slice(0, -1);
        }
        if (path.slice(-"/index.html".length) === "/index.html") {
            path = path.slice(0, -"/index.html".length) || "/";
        }
        return path || "/";
    }

    function markCurrentPage() {
        var currentPage = pageKey(window.location.pathname);

        document.querySelectorAll("[data-silk-nav]").forEach(function (link) {
            var target = new URL(link.getAttribute("href") || "", window.location.href);
            if (pageKey(target.pathname) === currentPage) {
                link.classList.add("active");
                link.setAttribute("aria-current", "page");

                var dropdown = link.closest(".dropdown");
                var toggle = dropdown && dropdown.querySelector(".dropdown-toggle");
                if (toggle) {
                    toggle.classList.add("active");
                }
            }
        });
    }

    function wireGalleryFilters() {
        document.querySelectorAll("[data-silk-gallery-filter-root]").forEach(function (root) {
            var buttons = Array.from(root.querySelectorAll("[data-silk-gallery-filter]"));
            var items = Array.from((root.parentElement || root).querySelectorAll("[data-gallery-item]"));
            var status = root.querySelector("[data-gallery-status]");

            if (!buttons.length || !items.length) {
                return;
            }

            function applyFilter(filter) {
                var visibleCount = 0;

                items.forEach(function (item) {
                    var matches = filter === "all" || item.getAttribute("data-gallery-category") === filter;
                    item.hidden = !matches;
                    item.setAttribute("aria-hidden", matches ? "false" : "true");
                    if (matches) {
                        visibleCount += 1;
                    }
                });

                buttons.forEach(function (button) {
                    var isActive = button.getAttribute("data-silk-gallery-filter") === filter;
                    button.setAttribute("aria-pressed", isActive ? "true" : "false");
                });

                if (status) {
                    status.textContent = visibleCount + (visibleCount === 1 ? " selected frame" : " selected frames");
                }
            }

            buttons.forEach(function (button) {
                button.addEventListener("click", function () {
                    applyFilter(button.getAttribute("data-silk-gallery-filter") || "all");
                });
            });

            applyFilter("all");
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

    function wireScrollReveal() {
        var revealItems = Array.from(document.querySelectorAll(
            "[data-silk-reveal], .scrollanimation, [data-aos], .silk-legacy-page .property-gallery-card, " +
            ".silk-legacy-page .property-card, .silk-legacy-page .journal-entry, " +
            ".silk-photo-mosaic-item"
        ));

        if (!revealItems.length) {
            return;
        }

        revealItems.forEach(function (item, index) {
            item.classList.add("silk-reveal-pending");
            item.style.setProperty("--silk-reveal-delay", (index % 6) * 70 + "ms");
        });

        function reveal(item) {
            item.classList.remove("silk-reveal-pending");
            item.classList.add("silk-reveal");
            window.requestAnimationFrame(function () {
                item.classList.add("is-visible");
            });
        }

        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            revealItems.forEach(function (item) {
                reveal(item);
            });
            return;
        }

        if (!("IntersectionObserver" in window)) {
            revealItems.forEach(function (item) {
                reveal(item);
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries, currentObserver) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    reveal(entry.target);
                    currentObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

        revealItems.forEach(function (item) {
            observer.observe(item);
        });
    }

    function wirePhotoModal() {
        var triggers = Array.from(document.querySelectorAll("[data-silk-lightbox]"));

        if (!triggers.length) {
            return;
        }

        var modal = document.createElement("div");
        modal.className = "modal fade silk-photo-modal";
        modal.id = "silkPhotoModal";
        modal.tabIndex = -1;
        modal.setAttribute("aria-hidden", "true");
        modal.innerHTML = [
            '<div class="modal-dialog modal-xl modal-dialog-centered">',
            '  <div class="modal-content">',
            '    <div class="modal-header">',
            '      <div>',
            '        <p class="mb-1 accent-color-2 text-uppercase small">SILK Homes photo</p>',
            '        <h2 class="h4 text-white mb-0" data-silk-photo-title>Photo</h2>',
            '      </div>',
            '      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close photo"></button>',
            '    </div>',
            '    <div class="modal-body">',
            '      <button type="button" class="silk-photo-modal-control prev" aria-label="Previous photo">‹</button>',
            '      <img class="silk-photo-modal-image" data-silk-photo-image alt="">',
            '      <button type="button" class="silk-photo-modal-control next" aria-label="Next photo">›</button>',
            '    </div>',
            '    <div class="modal-footer justify-content-between">',
            '      <span class="small text-white-50" data-silk-photo-count aria-live="polite"></span>',
            '      <span class="small text-white-50">Use the arrow keys to browse</span>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join("");
        document.body.appendChild(modal);

        var image = modal.querySelector("[data-silk-photo-image]");
        var title = modal.querySelector("[data-silk-photo-title]");
        var count = modal.querySelector("[data-silk-photo-count]");
        var previous = modal.querySelector(".silk-photo-modal-control.prev");
        var next = modal.querySelector(".silk-photo-modal-control.next");
        var groups = {};
        var activeGroup = [];
        var activeIndex = 0;
        var isOpen = false;

        triggers.forEach(function (trigger) {
            var groupName = trigger.getAttribute("data-silk-lightbox") || "photos";
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(trigger);
        });

        function renderPhoto() {
            var trigger = activeGroup[activeIndex];
            if (!trigger) {
                return;
            }

            var triggerImage = trigger.querySelector("img");
            var caption = trigger.getAttribute("data-silk-caption") || (triggerImage && triggerImage.alt) || "SILK Homes photo";
            image.src = trigger.getAttribute("href");
            image.alt = triggerImage ? triggerImage.alt : caption;
            title.textContent = caption;
            count.textContent = activeGroup.length > 1 ? (activeIndex + 1) + " of " + activeGroup.length : "";
            previous.hidden = activeGroup.length < 2;
            next.hidden = activeGroup.length < 2;
        }

        function visibleGroup(groupName) {
            return (groups[groupName] || []).filter(function (trigger) {
                return !trigger.closest("[hidden]");
            });
        }

        function showPhoto(groupName, index) {
            var allGroup = groups[groupName] || [];
            var selectedTrigger = allGroup[index];
            activeGroup = visibleGroup(groupName);
            activeIndex = activeGroup.indexOf(selectedTrigger);
            if (activeIndex < 0) {
                activeIndex = 0;
            }
            renderPhoto();
            isOpen = true;

            if (window.bootstrap && window.bootstrap.Modal) {
                window.bootstrap.Modal.getOrCreateInstance(modal).show();
            } else {
                modal.classList.add("show");
                modal.style.display = "block";
                modal.removeAttribute("aria-hidden");
                document.body.classList.add("modal-open");
            }
        }

        function stepPhoto(direction) {
            if (activeGroup.length < 2) {
                return;
            }
            activeIndex = (activeIndex + direction + activeGroup.length) % activeGroup.length;
            renderPhoto();
        }

        triggers.forEach(function (trigger) {
            trigger.addEventListener("click", function (event) {
                event.preventDefault();
                var groupName = trigger.getAttribute("data-silk-lightbox") || "photos";
                showPhoto(groupName, groups[groupName].indexOf(trigger));
            });
        });

        previous.addEventListener("click", function () { stepPhoto(-1); });
        next.addEventListener("click", function () { stepPhoto(1); });

        modal.addEventListener("hidden.bs.modal", function () {
            isOpen = false;
            image.removeAttribute("src");
        });

        document.addEventListener("keydown", function (event) {
            if (!isOpen) {
                return;
            }
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                stepPhoto(-1);
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                stepPhoto(1);
            }
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        markCurrentPage();
        wireGalleryFilters();
        wireStaticForms();
        wireScrollReveal();
        wirePhotoModal();
    });
})();
