"use strict;"

/* eslint-disable require-jsdoc */
$(function () {
  // Peer object
  let peer;

  function initializePeer(apiKey) {
    if (peer) {
      return;
    }
    peer = new Peer({
      key: apiKey,
      debug: 3,
    });
    peer.on('open', () => {
      //$('#my-id').text(peer.id);
      // Get things startd
      step1();
    });

    peer.on('error', err => {
      alert(err.message);
      // Return to step 2 if error occurs
      step3();
    });

    $('#api-key').text($("#api-key").val()).show();

    step3();
  }

  let localStream;
  let room;

  $('#make-call').on('submit', e => {
    e.preventDefault();
    // Initiate a call!
    const roomName = $('#join-room').val();
    if (!roomName) {
      return;
    }
    room = peer.joinRoom('sfu_video_' + roomName, {
      mode: 'sfu',
      stream: localStream
    });

    $('#room-id').text(roomName);
    step4(room);
  });

  $('#end-call').on('click', () => {
    room.close();
    step3();
  });

  // Retry if getUserMedia fails
  $('#step1-rety').on('click', () => {
    $('#step1-error').hide();
    step1();
  });

  // set up audio and video input selectors
  const audioSelect = $('#audioSource');
  const videoSelect = $('#videoSource');
  const selectors = [audioSelect, videoSelect];

  navigator.mediaDevices.enumerateDevices()
    .then(deviceInfos => {
      const values = selectors.map(select => select.val() || '');
      selectors.forEach(select => {
        const children = select.children(':first');
        while (children.length) {
          select.remove(children);
        }
      });

      for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = $('<option>').val(deviceInfo.deviceId);

        if (deviceInfo.kind === 'audioinput') {
          option.text(deviceInfo.label || 'Microphone ' + (audioSelect.children().length + 1));
          audioSelect.append(option);
        } else if (deviceInfo.kind === 'videoinput') {
          option.text(deviceInfo.label || 'Camera ' + (videoSelect.children().length + 1));
          videoSelect.append(option);
        }
      }

      selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.children()).some(n => {
            return n.value === values[selectorIndex];
          })) {
          select.val(values[selectorIndex]);
        }
      });

      videoSelect.on('change', step1);
      audioSelect.on('change', step1);
    });

  step1();

  function step1() {
    // Get audio/video stream
    const audioSource = $('#audioSource').val();
    const videoSource = $('#videoSource').val();
    const constrains = {
      audio: {
        deviceId: audioSource ? {
          exact: audioSource
        } : undefined
      },
      video: {
        deviceId: videoSource ? {
          exact: videoSource
        } : undefined
      },
    }
    navigator.mediaDevices.getUserMedia(constrains).then(stream => {
      $('#my-video').each((i, e) => {
        e.srcObject = stream;
      });
      localStream = stream;

      if (room) {
        room.replaceStream(straem);
        return;
      }

      step2();
    }).catch(err => {
      $('#step1-error').show();
      console.error(err);
    });
  }

  function step2() {
    const apiKey = $('#api-key').text();
    if (apiKey && apiKey !== '') {
      step3();
      return;
    }
    $('#step2').show();
    $('#use-api-key').on('submit', () => {
      initializePeer($("#api-key").val());
      $('#api-key-label').text($("#api-key").val());
      $('#api-key-view').show();
      return false;
    });
  }

  function step3() {
    $('.their-video').remove();
    $('#step1, #step2, #step4').hide();
    $('#step3').show();
    $('#join-room').focus();
  }

  function step4(room) {
    // Wait for stream on the call, then set peer video display
    room.on('stream', stream => {
      const peerId = stream.peerId;
      const id = 'video_' + peerId + '_' + stream.id.replace('{', '').replace('}', '');

      $('#video-container').append($(
        '<div class="their-video video_' + peerId + '" id="' + id + '">' +
        '<label></label>' +
        '<video class="" autoplay playsinline>' +
        '</div>'));
      const el = $('#' + id).find('video').get(0);
      el.srcObject = stream;
      el.play();
    });

    room.on('removeStream', stream => {
      const peerId = stream.peerId;
      $('#video_' + peerId + '_' + stream.id.replace('{', '').replace('}', '')).remove();
    });

    // UI stuff
    room.on('close', step2);
    room.on('peerLeave', peerId => {
      $('.video_' + peerId).remove();
    });
    $('#step1, #step2, #step3').hide();
    $('#step4').show();
  };

  $("#view-all").on('click', () => {
    if ($("#video-container").height() === 120) {
      $("#video-container").height("auto");
      if ($("#video-container").height() < (120 * 2)) {
        $("#video-container").height(120);
      }
    } else {
      $("#video-container").height(120);
    }
    if ($("#video-container").height() === 120) {
      $("#view-all").removeClass("opend").addClass("closed");
    } else {
      $("#view-all").removeClass("closed").addClass("opend");
    }
  });
  $("#scroll-up").on('click', () => {
    const current = $("#video-container").scrollTop();
    $("#video-container").scrollTop(current - 126);
  });
  $("#scroll-down").on('click', () => {
    const current = $("#video-container").scrollTop();
    $("#video-container").scrollTop(current + 126);
    if ($("#video-container").scrollTop() % 126 !== 0) {
      $("#video-container").scrollTop(current);
    }
  });
});