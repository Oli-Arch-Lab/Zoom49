function initAiDotEvents() {

  document.addEventListener("click", (e) => {

    const toggle = e.target.closest("#ai-dot-toggle");
    const closeBtn = e.target.closest("#ai-dot-close");
    const sendBtn = e.target.closest("#ai-dot-send");

    const root = document.getElementById("ai-dot-root");
    if (!root) return;

    const panel = document.getElementById("ai-dot-panel");
    const input = document.getElementById("ai-dot-input");
    const responseBox = document.getElementById("ai-dot-response");
    const weekData = JSON.parse(root.dataset.week || "[]");

    if (toggle) {
      panel.classList.toggle("hidden");
      toggle.classList.toggle("active");
    }

    if (closeBtn) {
      panel.classList.add("hidden");
      const dot = document.getElementById("ai-dot-toggle");
      dot?.classList.remove("active");
    }

    // Slide activation from AI result
    const resultLink = e.target.closest(".ai-dot-result-link");

    if (resultLink) {
      e.preventDefault();

      const slideIndex = resultLink.dataset.slide;
      const radio = document.getElementById(`slide-${slideIndex}`);

      if (radio) {
        radio.checked = true;

        const carousel = document.getElementById("carousel-root");
        carousel?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

      return;
    }

    if (sendBtn) {
      const value = input?.value.trim();
      if (!value) return;

      const dot = document.getElementById("ai-dot-toggle");
      dot?.classList.add("thinking");

      responseBox.innerHTML =
        "<div class='text-neutral-400'>Analyzing recursive signal...</div>";

      function levenshtein(a, b) {
        const matrix = [];

        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              );
            }
          }
        }

        return matrix[b.length][a.length];
      }

      function fuzzyMatch(query, text) {
        const q = query.toLowerCase();
        const t = text.toLowerCase();

        if (t.includes(q)) return true;

        const words = t.split(/\s+/);

        for (const word of words) {
          if (levenshtein(q, word) <= 2) {
            return true;
          }
        }

        return false;
      }

      function scoreMatch(query, text) {
        const q = query.toLowerCase();
        const t = text.toLowerCase();

        if (t.includes(q)) {
          return 3; // strong direct match
        }

        const words = t.split(/\s+/);

        let bestScore = 0;

        for (const word of words) {
          const distance = levenshtein(q, word);

          if (distance === 0) return 3;
          if (distance === 1) bestScore = Math.max(bestScore, 2);
          if (distance === 2) bestScore = Math.max(bestScore, 1);
        }

        return bestScore;
      }

      function highlight(text, query) {
        const regex = new RegExp(`(${query})`, "gi");
        return text.replace(regex, "<mark class='bg-yellow-200'>$1</mark>");
      }

      function searchContext(query, weekData) {
        query = query.toLowerCase();
        const results = [];

        for (const fig of weekData) {

          let score = 0;

          score = Math.max(score, scoreMatch(query, fig.title));

          for (const event of fig.keyEvents || []) {
            score = Math.max(score, scoreMatch(query, event));
          }

          for (const character in fig.characterArcs || {}) {
            score = Math.max(score, scoreMatch(query, character));
          }

          for (const motif of fig.motifs || []) {
            score = Math.max(score, scoreMatch(query, motif));
          }

          if (score > 0) {
            results.push({ fig, score });
          }
        }

        if (results.length === 0) {
          return "<div>No recursive match found in this week.</div>";
        }

        results.sort((a, b) => b.score - a.score);
        const top = results.slice(0, 3);

        return top.map(r => {
          const confidence = Math.min(100, r.score * 35 + 30);

          return `
            <div class="border border-neutral-200 rounded-lg p-3 mb-3">
              <div class="font-semibold text-sm">
                <a href="#"
                  class="ai-dot-result-link text-signal hover:underline"
                  data-slide="${r.fig.id - 1}">
                  Figure ${r.fig.id} — ${highlight(r.fig.title, query)}
                </a>
              </div>
              <div class="text-xs text-neutral-600 mt-1">
                ${highlight(r.fig.keyEvents?.[0] || "", query)}
              </div>
              <div class="text-xs text-neutral-400 mt-2">
                Confidence: ${confidence}%
              </div>
            </div>
          `;
        }).join("");
      }

      setTimeout(() => {
        const result = searchContext(value, weekData);

        responseBox.innerHTML =
          `<div class="mb-3 font-semibold">AI Dot Results</div>${result}`;

        dot?.classList.remove("thinking");
      }, 1200);
    }
  });
}

// Run once
initAiDotEvents();