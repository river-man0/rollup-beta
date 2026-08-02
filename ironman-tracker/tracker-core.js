// Pure race-tracking logic for the IRONMAN Canada-Ottawa dashboard.
// No DOM, no network, no Leaflet — everything here is unit-testable in Node.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.TrackerCore = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {

  var TOTAL_KM_FALLBACK = 227.4164;

  // After crossing a given mat, which segment is the athlete actually on?
  // Crossing SWIM (swim exit) puts them in transition; crossing T1 puts them
  // onto the bike; crossing the BIKE (bike finish) mat puts them into T2, etc.
  function activeSegmentAfter(matName) {
    if (!matName) return 'pre';
    var n = String(matName).toUpperCase();
    if (n === 'FINISH') return 'finished';
    if (n === 'ANNOUNCER') return 'run';
    if (n === 'T2') return 'run';
    if (n === 'BIKE') return 'transition';   // bike-course end mat -> in T2
    if (n === 'T1') return 'bike';
    if (n === 'SWIM') return 'transition';   // swim-exit mat -> in T1
    if (n === 'START') return 'swim';
    if (n.indexOf('BIKE') === 0) return 'bike';
    if (n.indexOf('RUN') === 0) return 'run';
    return 'unknown';
  }

  function findPoint(points, name) {
    if (!name) return null;
    var n = String(name).toUpperCase();
    for (var i = 0; i < points.length; i++) {
      if (points[i].name.toUpperCase() === n) return points[i];
    }
    return null;
  }

  // The RTRT splits API response shape can vary slightly between events, so be
  // liberal about which field carries the timing-point name and time values.
  function splitPointName(split) {
    return split.point || split.pointName || split.name || split.label || null;
  }

  function splitTimeValue(split) {
    var keys = ['time', 'netTime', 'waveTime', 'tod', 'timestamp', 'epochTime'];
    for (var i = 0; i < keys.length; i++) {
      var v = split[keys[i]];
      if (v !== undefined && v !== null && v !== '') {
        return { field: keys[i], value: String(v) };
      }
    }
    return { field: null, value: null };
  }

  // Normalize an API splits response ({list:[...]}, or a bare array) into
  // ordered rows matched against the official course points. Rows for mats we
  // can't match are kept (km/coords null) so nothing is silently dropped.
  function normalizeSplits(response, points) {
    var raw = [];
    if (response && Object.prototype.toString.call(response.list) === '[object Array]') raw = response.list;
    else if (Object.prototype.toString.call(response) === '[object Array]') raw = response;

    var rows = [];
    for (var i = 0; i < raw.length; i++) {
      var s = raw[i];
      var pname = splitPointName(s);
      var pt = findPoint(points, pname);
      var t = splitTimeValue(s);
      rows.push({
        point: pname ? String(pname).toUpperCase() : null,
        label: pt ? pt.label : (pname || '?'),
        segment: pt ? pt.segment : null,
        km: pt ? pt.km : null,
        lat: pt ? pt.lat : null,
        lng: pt ? pt.lng : null,
        timeField: t.field,
        timeValue: t.value,
        matched: !!pt,
        raw: s
      });
    }
    // Order by course distance; unmatched rows sink to the end in arrival order.
    rows.sort(function (a, b) {
      if (a.km === null && b.km === null) return 0;
      if (a.km === null) return 1;
      if (b.km === null) return -1;
      return a.km - b.km;
    });
    return rows;
  }

  // Furthest-along matched mat = last chip read we can place on the course.
  function lastMat(rows) {
    for (var i = rows.length - 1; i >= 0; i--) {
      if (rows[i].matched) return rows[i];
    }
    return null;
  }

  function nextPoint(points, lastMatName) {
    var pt = findPoint(points, lastMatName);
    if (!pt) return points.length ? points[0] : null;
    var idx = points.indexOf(pt);
    return idx >= 0 && idx + 1 < points.length ? points[idx + 1] : null;
  }

  function progressPercent(points, lastMatName) {
    var pt = findPoint(points, lastMatName);
    if (!pt) return 0;
    var total = points.length ? points[points.length - 1].km : TOTAL_KM_FALLBACK;
    if (!total) return 0;
    return Math.min(100, Math.round((pt.km / total) * 1000) / 10);
  }

  // Geographic bounds for a course segment, for the map-view bookmarks.
  // 'swim' bookmark includes T1 (same venue); 'run' includes T2 and finish.
  function segmentPoints(points, segment) {
    return points.filter(function (p) {
      if (segment === 'swim') return p.segment === 'swim' || p.name === 'T1';
      if (segment === 'bike') return p.segment === 'bike' || p.name === 'T1' || p.name === 'T2';
      if (segment === 'run') return p.segment === 'run' || p.name === 'T2';
      return true;
    });
  }

  function segmentBounds(points, segment) {
    var pts = segmentPoints(points, segment);
    if (!pts.length) return null;
    return boundsOfLatLngs(pts.map(function (p) { return [p.lat, p.lng]; }));
  }

  // Bounds of an array of [lat, lng] pairs (e.g. course geometry vertices).
  function boundsOfLatLngs(latlngs) {
    if (!latlngs || !latlngs.length) return null;
    var minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    latlngs.forEach(function (ll) {
      if (ll[0] < minLat) minLat = ll[0];
      if (ll[0] > maxLat) maxLat = ll[0];
      if (ll[1] < minLng) minLng = ll[1];
      if (ll[1] > maxLng) maxLng = ll[1];
    });
    return [[minLat, minLng], [maxLat, maxLng]];
  }

  // Redact participant-identifying name fields before anything is rendered
  // into the on-page debug panel. Applied recursively.
  var REDACT_KEYS = { fname: 1, lname: 1, name: 1, profile_pic: 1, claimed_by: 1 };
  function redactPII(value) {
    if (Object.prototype.toString.call(value) === '[object Array]') {
      return value.map(redactPII);
    }
    if (value && typeof value === 'object') {
      var out = {};
      Object.keys(value).forEach(function (k) {
        out[k] = REDACT_KEYS[k.toLowerCase()] ? '■■■' : redactPII(value[k]);
      });
      return out;
    }
    return value;
  }

  function formatKm(km) {
    if (km === null || km === undefined) return '—';
    return (Math.round(km * 10) / 10).toFixed(1) + ' km';
  }

  // Render a time value for display. Numeric epoch seconds become a clock time
  // in the given IANA timezone; anything else (e.g. "1:58:12") passes through.
  function formatTimeValue(timeValue, timeZone) {
    if (timeValue === null || timeValue === undefined || timeValue === '') return '—';
    var s = String(timeValue);
    if (/^\d{9,13}(\.\d+)?$/.test(s)) {
      var ms = s.length >= 13 ? parseFloat(s) : parseFloat(s) * 1000;
      try {
        return new Date(ms).toLocaleTimeString('en-CA', {
          hour: 'numeric', minute: '2-digit', second: '2-digit',
          timeZone: timeZone || 'America/Toronto'
        }) + ' ET';
      } catch (e) { return s; }
    }
    return s;
  }

  return {
    activeSegmentAfter: activeSegmentAfter,
    findPoint: findPoint,
    splitPointName: splitPointName,
    splitTimeValue: splitTimeValue,
    normalizeSplits: normalizeSplits,
    lastMat: lastMat,
    nextPoint: nextPoint,
    progressPercent: progressPercent,
    segmentPoints: segmentPoints,
    segmentBounds: segmentBounds,
    boundsOfLatLngs: boundsOfLatLngs,
    redactPII: redactPII,
    formatKm: formatKm,
    formatTimeValue: formatTimeValue
  };
}));
