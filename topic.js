/**
 * 주제별 의견 앱 - 주제 상세 페이지 (새 창)
 * Firebase Realtime Database를 사용하여 의견 추가/삭제
 */
import { db } from "./firebase-config.js";
import {
  ref,
  onValue,
  push,
  remove,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";

const TOPICS_PATH = "chapter4/topics";
var STORAGE_KEY_MINE = "topic-opinion-mine-chapter4";

(function () {
  var topicId = getTopicIdFromUrl();
  var topic = null;

  var topicTitleEl = document.getElementById("topicTitle");
  var btnClose = document.getElementById("btnClose");
  var opinionForm = document.getElementById("opinionForm");
  var opinionList = document.getElementById("opinionList");

  function getTopicIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("id") || "";
  }

  function getMyOpinionIds() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_MINE);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && data[topicId] && Array.isArray(data[topicId])) {
          return data[topicId];
        }
      }
    } catch (e) {}
    return [];
  }

  function addMyOpinionId(opinionId) {
    try {
      var data = {};
      var raw = localStorage.getItem(STORAGE_KEY_MINE);
      if (raw) {
        try {
          data = JSON.parse(raw) || {};
        } catch (e) {}
      }
      if (!data[topicId]) data[topicId] = [];
      if (data[topicId].indexOf(opinionId) === -1) {
        data[topicId].push(opinionId);
        localStorage.setItem(STORAGE_KEY_MINE, JSON.stringify(data));
      }
    } catch (e) {}
  }

  function removeMyOpinionId(opinionId) {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_MINE);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data || !data[topicId]) return;
      data[topicId] = data[topicId].filter(function (id) {
        return id !== opinionId;
      });
      if (data[topicId].length === 0) delete data[topicId];
      localStorage.setItem(STORAGE_KEY_MINE, JSON.stringify(data));
    } catch (e) {}
  }

  function escapeHtml(text) {
    if (!text) return "";
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // opinions 객체를 배열로 변환 (정렬: 최신순)
  function opinionsToArray(opinionsObj) {
    if (!opinionsObj || typeof opinionsObj !== "object") return [];
    return Object.keys(opinionsObj)
      .map(function (key) {
        var o = opinionsObj[key];
        return {
          id: key,
          author: o.author || null,
          text: o.text || "",
          createdAt: o.createdAt || 0,
        };
      })
      .sort(function (a, b) {
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
  }

  function renderOpinionList(opinionsArr, myOpinionIds) {
    if (!opinionList) return;
    var mineSet = {};
    (myOpinionIds || []).forEach(function (id) {
      mineSet[id] = true;
    });

    if (!opinionsArr || opinionsArr.length === 0) {
      opinionList.innerHTML =
        '<li class="opinion-empty">아직 의견이 없어요. 첫 번째 의견을 남겨보세요!</li>';
      return;
    }

    opinionList.innerHTML = opinionsArr
      .map(function (o) {
        var authorClass = o.author ? "" : " anonymous";
        var authorDisplay = o.author || "익명";
        var canDelete = !!mineSet[o.id];
        var deleteBtn = canDelete
          ? '<button type="button" class="btn-delete-opinion" data-id="' +
            escapeHtml(o.id) +
            '" aria-label="의견 삭제">×</button>'
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
        var opinionId = btn.dataset.id;
        if (!opinionId) return;
        if (!confirm("이 의견을 삭제할까요?")) return;

        var opinionRef = ref(
          db,
          TOPICS_PATH + "/" + topicId + "/opinions/" + opinionId
        );
        remove(opinionRef)
          .then(function () {
            removeMyOpinionId(opinionId);
          })
          .catch(function (err) {
            alert("삭제에 실패했습니다: " + (err.message || err));
          });
      });
    });
  }

  function init() {
    if (!topicId) {
      document.body.innerHTML =
        "<p style='padding:20px;text-align:center;'>주제를 찾을 수 없습니다.</p>";
      return;
    }

    if (btnClose) {
      btnClose.addEventListener("click", function (e) {
        e.preventDefault();
        window.close();
        if (!window.closed) {
          window.location.href = "index.html";
        }
      });
    }

    // Firebase에서 주제 실시간 구독
    var topicRef = ref(db, TOPICS_PATH + "/" + topicId);
    onValue(topicRef, function (snapshot) {
      topic = snapshot.val();
      if (!topic) {
        document.body.innerHTML =
          "<p style='padding:20px;text-align:center;'>주제를 찾을 수 없습니다.</p>";
        return;
      }

      if (topicTitleEl) topicTitleEl.textContent = topic.title || "주제";

      var opinionsArr = opinionsToArray(topic.opinions);
      var myOpinionIds = getMyOpinionIds();
      renderOpinionList(opinionsArr, myOpinionIds);
    });

    opinionForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var authorInput = opinionForm.querySelector('input[name="author"]');
      var opinionInput = opinionForm.querySelector('textarea[name="opinion"]');
      var text =
        opinionInput && opinionInput.value ? opinionInput.value.trim() : "";
      if (!text) return;

      var newOpinion = {
        author:
          authorInput && authorInput.value
            ? authorInput.value.trim() || null
            : null,
        text: text,
        createdAt: Date.now(),
      };

      var opinionsRef = ref(db, TOPICS_PATH + "/" + topicId + "/opinions");
      push(opinionsRef, newOpinion)
        .then(function (snapRef) {
          var opinionId = snapRef.key;
          addMyOpinionId(opinionId);
          if (opinionInput) opinionInput.value = "";
          alert("의견이 등록되었습니다.");
        })
        .catch(function (err) {
          alert("의견 등록에 실패했습니다: " + (err.message || err));
        });
    });
  }

  init();
})();
