(() => {
    const modules = {
        "sustainability.html": {
            title: "Sustainability at BOS",
            button: "#completion button[onclick='downloadCertificate()']",
            dateKey: "finishedAt"
        },
        "ai-ethics.html": {
            title: "AI Vision & Ethical Framework",
            button: "#completion button[onclick='downloadCertificate()']",
            nameInput: "certificateName",
            dateKey: "completedDate",
            hours: "Professional Development Hours: 1"
        },
        "google-workspace.html": {
            title: "Google Workspace Studio",
            button: "#print",
            nameInput: "name",
            dateKey: "date",
            hours: "Proposed Professional Development Hours: 1"
        },
        "notebooklm.html": {
            title: "NotebookLM for Educators",
            button: "#deck-print",
            nameInput: "deck-name",
            dateKey: "date"
        },
        "ai-assessment.html": {
            title: "AI & Assessment Design",
            button: "#printCertificate",
            nameInput: "fullName",
            dateKey: "date",
            hours: "Proposed Professional Development Hours: 1"
        }
    };

    const filename = location.pathname.split("/").pop();
    const module = modules[filename];
    if (!module) return;

    const button = document.querySelector(module.button);
    if (!button) return;

    const completion = button.closest(
        "#completion, #complete, #certificate, #deck-certificate"
    );
    if (!completion) return;

    button.textContent = "Download Your Certificate";

    for (const label of completion.querySelectorAll("strong")) {
        if (label.textContent.trim() === "Aygun Mammadoiva") {
            label.textContent = "Aygun Mammadova";
        }
    }

    const status = document.createElement("p");
    status.setAttribute("role", "status");
    button.after(status);

    let pdfLibrary;

    function loadPdfLibrary() {
        if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);

        if (!pdfLibrary) {
            pdfLibrary = new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/npm/jspdf@3.0.3/dist/jspdf.umd.min.js";
                script.onload = () => {
                    const Pdf = window.jspdf?.jsPDF;
                    if (Pdf) resolve(Pdf);
                    else reject(new Error("PDF library unavailable"));
                };
                script.onerror = () => {
                    script.remove();
                    reject(new Error("PDF library could not load"));
                };
                document.head.append(script);
            }).catch(error => {
                pdfLibrary = null;
                throw error;
            });
        }

        return pdfLibrary;
    }

    function loadLogo() {
        return new Promise((resolve, reject) => {
            const logo = new Image();
            logo.onload = () => resolve(logo);
            logo.onerror = reject;
            logo.src = "./Baku-oxford-school-Logo.png";
        });
    }

    function drawCertificate(name, date, logo) {
        const canvas = document.createElement("canvas");
        canvas.width = 2400;
        canvas.height = 1697;

        const ctx = canvas.getContext("2d");
        ctx.scale(2, 2);

        const navy = "#002147";
        const gold = "#af853c";
        const ink = "#42556c";

        ctx.fillStyle = "#fffdf6";
        ctx.fillRect(0, 0, 1200, 849);

        ctx.strokeStyle = navy;
        ctx.lineWidth = 5;
        ctx.strokeRect(29, 29, 1142, 791);

        ctx.strokeStyle = gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(42, 42, 1116, 765);

        const logoScale = Math.min(115 / logo.width, 115 / logo.height);
        const logoWidth = logo.width * logoScale;
        const logoHeight = logo.height * logoScale;
        ctx.drawImage(logo, (1200 - logoWidth) / 2, 64, logoWidth, logoHeight);

        function write(text, y, font, colour, maxWidth = 1000) {
            ctx.font = font;
            ctx.fillStyle = colour;
            ctx.textAlign = "center";
            ctx.fillText(text, 600, y, maxWidth);
        }

        function line(x1, x2, y) {
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.stroke();
        }

        write("BAKU OXFORD SCHOOL", 211, "bold 21px Arial", navy);
        write("Cogito, ergo sum", 243, "italic 19px Georgia", gold);
        write("Certificate of Completion", 325, "bold 65px Georgia", navy);
        write("PROFESSIONAL DEVELOPMENT", 365, "bold 18px Arial", gold);
        write("Presented to", 421, "23px Arial", ink);
        write(name, 487, "italic 54px Georgia", navy);

        line(265, 935, 510);

        write("For completing the professional learning module", 551, "23px Arial", ink);
        write(module.title, 602, "bold 34px Georgia", navy);
        write(`Completed on ${date}`, 643, "20px Arial", ink);

        if (module.hours) {
            write(module.hours, 673, "18px Arial", ink);
        }

        line(460, 740, 714);

        write("Aygun Mammadova", 748, "bold 26px Georgia", navy);
        write("General Manager", 776, "18px Arial", ink);
        write("Sample certificate pending institutional approval", 798, "13px Arial", ink);

        return canvas;
    }

    button.addEventListener("click", async event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (completion.hidden || getComputedStyle(completion).display === "none") {
            return;
        }

        const courseState = typeof state === "undefined" ? {} : state;
        const input = module.nameInput
            ? document.getElementById(module.nameInput)
            : null;
        const name = (input?.value ?? courseState.name ?? "").trim();

        if (!name) {
            status.textContent = "Enter your full name to download the certificate.";
            input?.focus();
            return;
        }

        const completionDate = new Date(courseState[module.dateKey]);
        if (Number.isNaN(completionDate.getTime())) {
            status.textContent = "The completion date is missing from this course record.";
            return;
        }

        button.disabled = true;
        status.textContent = "Preparing your PDF…";

        try {
            const [Pdf, logo] = await Promise.all([loadPdfLibrary(), loadLogo()]);
            const date = completionDate.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });

            const canvas = drawCertificate(name, date, logo);
            const pdf = new Pdf({ orientation: "landscape", unit: "mm", format: "a4" });
            pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 297, 210);
            pdf.save(`BOS-${filename.replace(".html", "")}-certificate.pdf`);
            status.textContent = "Your certificate PDF is ready.";
        } catch {
            status.textContent = "The PDF could not be prepared. Check your connection and try again.";
        } finally {
            button.disabled = false;
        }
    }, true);
})();
