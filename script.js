/**
 * 주제별 의견 앱 - 메인 페이지
 * 권한자가 주제를 입력, 주제 클릭 시 새 창에서 의견 작성
 */
(function () {
  var STORAGE_KEY = "topic-opinion-chapter4";

  var topics = loadData();

  var topicForm = document.getElementById("topicForm");
  var topicTitleInput = document.getElementById("topicTitle");
  var topicAdminPinInput = document.getElementById("topicAdminPin");
  var topicList = document.getElementById("topicList");

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && data.topics && Array.isArray(data.topics)) {
          return data.topics;
        }
      }
    } catch (e) {
      console.warn("저장된 데이터 로드 실패:", e);
    }
    return [];
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ topics: topics }));
    } catch (e) {
      console.warn("데이터 저장 실패:", e);
    }
  }

  function generateId() {
    return "topic_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  }

  function escapeHtml(text) {
    if (!text) return "";
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function getTopicUrl(topicId) {
    var path = "topic.html?id=" + encodeURIComponent(topicId);
    try {
      return new URL(path, window.location.href).href;
    } catch (e) {
      return "topic.html?id=" + encodeURIComponent(topicId);
    }
  }

  function openTopicWindow(topicId) {
    var url = getTopicUrl(topicId);
    window.open(url, "topic_" + topicId, "width=420,height=700,scrollbars=yes");
  }

  function renderTopicList() {
    if (!topicList) return;

    if (topics.length === 0) {
      topicList.innerHTML =
        '<p class="topic-list-empty">등록된 주제가 없습니다.<br>권한자가 위에서 주제를 추가해주세요.</p>';
      return;
    }

    topicList.innerHTML = topics
      .map(function (t) {
        var hasAdminPin = !!(t.adminPin && t.adminPin.length >= 4);
        var deleteBtn = hasAdminPin
          ? '<button type="button" class="btn-delete-topic" data-id="' + t.id + '">삭제</button>'
          : "";
        var opinionCount = (t.opinions || []).length;
        return (
          '<article class="topic-block topic-link-block" data-id="' +
          t.id +
          '">' +
          '<div class="topic-block-header">' +
          '<h3 class="topic-title">' +
          escapeHtml(t.title) +
          "</h3>" +
          deleteBtn +
          "</div>" +
          '<p class="topic-meta-inline">💬 ' +
          opinionCount +
          "개 의견 · 클릭하여 의견 작성</p>" +
          "</article>"
        );
      })
      .join("");

    // 주제 클릭 → 새 창 열기
    topicList.querySelectorAll(".topic-link-block").forEach(function (block) {
      block.addEventListener("click", function (e) {
        if (e.target.closest(".btn-delete-topic")) return;
        openTopicWindow(block.dataset.id);
      });
    });

    // 주제 삭제 (권한자만)
    topicList.querySelectorAll(".btn-delete-topic").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var topic = topics.find(function (t) {
          return t.id === btn.dataset.id;
        });
        if (!topic) return;

        var pin = prompt("권한자 비밀번호를 입력하세요. (주제 삭제)");
        if (pin === null) return;

        if (topic.adminPin !== pin) {
          alert("비밀번호가 일치하지 않습니다. 주제 삭제는 주제를 등록한 권한자만 가능합니다.");
          return;
        }

        if (confirm("이 주제를 삭제할까요? 등록된 의견도 함께 삭제됩니다.")) {
          topics = topics.filter(function (t) {
            return t.id !== btn.dataset.id;
          });
          saveData();
          renderTopicList();
        }
      });
    });
  }

  topicForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var title = topicTitleInput.value.trim();
    if (!title) return;

    var adminPin = topicAdminPinInput && topicAdminPinInput.value ? topicAdminPinInput.value.trim() : "";
    if (!adminPin || adminPin.length < 4) {
      alert("주제 삭제용 비밀번호는 4자리 이상 입력해주세요.");
      return;
    }

    var newTopic = {
      id: generateId(),
      title: title,
      desc: null,
      adminPin: adminPin,
      opinions: [],
      createdAt: Date.now()
    };
    topics.unshift(newTopic);

    saveData();
    renderTopicList();

    topicTitleInput.value = "";
    if (topicAdminPinInput) topicAdminPinInput.value = "";
    topicTitleInput.focus();

    // 주제 추가 후 새 창에서 바로 의견 작성 가능하도록 열기
    openTopicWindow(newTopic.id);
  });

  renderTopicList();
})();
