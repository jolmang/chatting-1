/**
 * 주제별 의견 앱 - 메인 페이지
 * Firebase Realtime Database를 사용하여 주제 추가/삭제
 */
import { db } from "./firebase-config.js";
import {
  ref,
  onValue,
  set,
  remove,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";

const TOPICS_PATH = "chapter4/topics";

(function () {
  var topics = [];

  var topicForm = document.getElementById("topicForm");
  var topicTitleInput = document.getElementById("topicTitle");
  var topicAdminPinInput = document.getElementById("topicAdminPin");
  var topicList = document.getElementById("topicList");

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

  // Firebase에서 주제 목록 실시간 구독
  function subscribeTopics() {
    var topicsRef = ref(db, TOPICS_PATH);
    onValue(topicsRef, function (snapshot) {
      var data = snapshot.val();
      topics = [];
      if (data) {
        Object.keys(data).forEach(function (key) {
          var t = data[key];
          if (t && t.id) {
            topics.push({
              id: t.id,
              title: t.title || "",
              desc: t.desc || null,
              adminPin: t.adminPin || "",
              opinions: t.opinions || {},
              createdAt: t.createdAt || 0,
            });
          }
        });
        topics.sort(function (a, b) {
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
      }
      renderTopicList();
    });
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
        var opinionObj = t.opinions || {};
        var opinionCount = Object.keys(opinionObj).length;
        var hasAdminPin = !!(t.adminPin && t.adminPin.length >= 4);
        var deleteBtn = hasAdminPin
          ? '<button type="button" class="btn-delete-topic" data-id="' +
            t.id +
            '">삭제</button>'
          : "";
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

    topicList.querySelectorAll(".topic-link-block").forEach(function (block) {
      block.addEventListener("click", function (e) {
        if (e.target.closest(".btn-delete-topic")) return;
        openTopicWindow(block.dataset.id);
      });
    });

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
          alert(
            "비밀번호가 일치하지 않습니다. 주제 삭제는 주제를 등록한 권한자만 가능합니다."
          );
          return;
        }

        if (
          confirm(
            "이 주제를 삭제할까요? 등록된 의견도 함께 삭제됩니다."
          )
        ) {
          var topicRef = ref(db, TOPICS_PATH + "/" + topic.id);
          remove(topicRef).then(function () {
            renderTopicList();
          }).catch(function (err) {
            alert("삭제에 실패했습니다: " + (err.message || err));
          });
        }
      });
    });
  }

  topicForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var title = topicTitleInput.value.trim();
    if (!title) return;

    var adminPin =
      topicAdminPinInput && topicAdminPinInput.value
        ? topicAdminPinInput.value.trim()
        : "";
    if (!adminPin || adminPin.length < 4) {
      alert("주제 삭제용 비밀번호는 4자리 이상 입력해주세요.");
      return;
    }

    var newTopicId = generateId();
    var newTopic = {
      id: newTopicId,
      title: title,
      desc: null,
      adminPin: adminPin,
      opinions: {},
      createdAt: Date.now(),
    };

    var topicRef = ref(db, TOPICS_PATH + "/" + newTopicId);
    set(topicRef, newTopic)
      .then(function () {
        topicTitleInput.value = "";
        if (topicAdminPinInput) topicAdminPinInput.value = "";
        topicTitleInput.focus();
        openTopicWindow(newTopicId);
      })
      .catch(function (err) {
        alert("주제 추가에 실패했습니다: " + (err.message || err));
      });
  });

  subscribeTopics();
})();
