/**
 * 주제별 의견 앱 - 주제 상세 페이지 (새 창)
 * 의견 작성, 본인 의견만 삭제 가능 (삭제 코드로 확인)
 */
(function () {
  var STORAGE_KEY = "topic-opinion-chapter4";

  var topicId = getTopicIdFromUrl();
  var topic = loadTopic();

  var topicTitleEl = document.getElementById("topicTitle");
  var btnClose = document.getElementById("btnClose");
  var opinionForm = document.getElementById("opinionForm");
  var opinionList = document.getElementById("opinionList");

  function getTopicIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("id") || "";
  }

  function loadAllData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && data.topics && Array.isArray(data.topics)) {
          return data.topics;
        }
      }
    } catch (e) {
      console.warn("데이터 로드 실패:", e);
    }
    return [];
  }

  function loadTopic() {
    return loadAllData().find(function (t) {
      return t.id === topicId;
    });
  }

  function saveTopics(topicsData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ topics: topicsData }));
    } catch (e) {
      console.warn("데이터 저장 실패:", e);
    }
  }

  function generateDeleteCode() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var code = "";
    for (var i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  function escapeHtml(text) {
    if (!text) return "";
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function renderOpinionList() {
    if (!opinionList || !topic) return;

    var opinions = topic.opinions || [];

    if (opinions.length === 0) {
      opinionList.innerHTML = '<li class="opinion-empty">아직 의견이 없어요. 첫 번째 의견을 남겨보세요!</li>';
      return;
    }

    opinionList.innerHTML = opinions
      .map(function (o, idx) {
        var authorClass = o.author ? "" : " anonymous";
        var authorDisplay = o.author || "익명";
        var canDelete = !!o.deleteCode;
        var deleteBtn = canDelete
          ? '<button type="button" class="btn-delete-opinion" data-idx="' + idx + '" aria-label="의견 삭제">×</button>'
          : "";
        return (
          '<li class="opinion-item">' +
          '<div class="opinion-item-wrapper">' +
          '<div class="opinion-item-content">' +
          '<p class="opinion-author' +
          authorClass +
          '">' +
          escapeHtml(authorDisplay) +
          "</p>" +
          '<p class="opinion-text">' +
          escapeHtml(o.text) +
          "</p>" +
          "</div>" +
          deleteBtn +
          "</div>" +
          "</li>"
        );
      })
      .join("");

    opinionList.querySelectorAll(".btn-delete-opinion").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.dataset.idx, 10);
        var opinion = topic.opinions[idx];
        if (!opinion) return;

        var input = prompt("삭제하려면 작성 시 안내된 삭제 코드를 입력하세요.");
        if (input === null) return;

        if (opinion.deleteCode && input.trim().toUpperCase() === opinion.deleteCode.toUpperCase()) {
          topic.opinions.splice(idx, 1);
          var topicsData = loadAllData();
          var t = topicsData.find(function (x) {
            return x.id === topicId;
          });
          if (t) {
            t.opinions = topic.opinions;
            saveTopics(topicsData);
          }
          renderOpinionList();
        } else {
          alert("삭제 코드가 일치하지 않습니다.");
        }
      });
    });
  }

  function init() {
    if (!topicId || !topic) {
      document.body.innerHTML = "<p style='padding:20px;text-align:center;'>주제를 찾을 수 없습니다.</p>";
      return;
    }

    if (topicTitleEl) topicTitleEl.textContent = topic.title;

    if (btnClose) {
      btnClose.addEventListener("click", function (e) {
        e.preventDefault();
        window.close();
        if (!window.closed) {
          window.location.href = "index.html";
        }
      });
    }

    opinionForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var authorInput = opinionForm.querySelector('input[name="author"]');
      var opinionInput = opinionForm.querySelector('textarea[name="opinion"]');
      var text = opinionInput && opinionInput.value ? opinionInput.value.trim() : "";
      if (!text) return;

      var deleteCode = generateDeleteCode();

      if (!topic.opinions) topic.opinions = [];
      topic.opinions.push({
        author: authorInput && authorInput.value ? authorInput.value.trim() || null : null,
        text: text,
        deleteCode: deleteCode,
        createdAt: Date.now()
      });

      var topicsData = loadAllData();
      var t = topicsData.find(function (x) {
        return x.id === topicId;
      });
      if (t) {
        t.opinions = topic.opinions;
        saveTopics(topicsData);
      }

      if (opinionInput) opinionInput.value = "";

      renderOpinionList();

      alert("의견이 등록되었습니다.\n\n삭제하려면 아래 코드를 기억해두세요.\n삭제 코드: " + deleteCode);
    });

    renderOpinionList();
  }

  init();
})();
