#!/usr/bin/env node
// Test suite for the IRONMAN Canada-Ottawa live dashboard logic.
// Feeds the REAL course GPS coordinates (captured from the RTRT.me points
// endpoint) through tracker-core with FAKE chip times, and asserts on the
// derived state the page renders from.
'use strict';

const path = require('path');
const POINTS = require(path.join(__dirname, '..', 'points-data.js'));
const Core = require(path.join(__dirname, '..', 'tracker-core.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok  ' + name);
  } catch (e) {
    failed++;
    console.error('FAIL  ' + name + '\n      ' + e.message);
  }
}
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error((msg || 'assertion failed') + ': expected ' + b + ', got ' + a);
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'expected truthy'); }

// A fake mid-race splits API response using real mat names but fabricated
// times, deliberately out of course order to exercise sorting.
const FAKE_MIDRACE_RESPONSE = {
  list: [
    { point: 'BIKE1', time: '3:01:44' },
    { point: 'START', time: '0:00:00' },
    { point: 'T1', time: '2:41:07' },
    { point: 'SWIM', time: '2:31:55' },
    { point: 'BIKE2', time: '3:18:02' },
    { point: 'MYSTERY_MAT', time: '9:99:99' } // unmatched mat must not be dropped
  ],
  info: { cacheVer: '0~0' }
};

console.log('\n== course data sanity (real GPS coords) ==');
test('40 official timing points loaded', () => eq(POINTS.length, 40));
test('course starts at START and ends at FINISH', () => {
  eq(POINTS[0].name, 'START');
  ok(POINTS[0].isStart, 'START flagged isStart');
  eq(POINTS[POINTS.length - 1].name, 'FINISH');
  ok(POINTS[POINTS.length - 1].isFinish, 'FINISH flagged isFinish');
});
test('total course distance is ~227.4 km', () => {
  const total = POINTS[POINTS.length - 1].km;
  ok(Math.abs(total - 227.4164) < 0.001, 'got ' + total);
});
test('all coords are inside the Ottawa/Gatineau bounding box', () => {
  POINTS.forEach(p => {
    ok(p.lat > 45.30 && p.lat < 45.50, p.name + ' lat ' + p.lat);
    ok(p.lng > -75.90 && p.lng < -75.50, p.name + ' lng ' + p.lng);
  });
});
test('km values are strictly increasing along the course', () => {
  for (let i = 1; i < POINTS.length; i++) {
    ok(POINTS[i].km > POINTS[i - 1].km, POINTS[i].name + ' km not increasing');
  }
});
test('segment counts match the official layout', () => {
  const count = seg => POINTS.filter(p => p.segment === seg).length;
  eq(count('swim'), 2);        // START, SWIM
  eq(count('transition'), 2);  // T1, T2
  eq(count('bike'), 17);       // BIKE1..BIKE16 + BIKE
  eq(count('run'), 19);        // RUN1..RUN17 + ANNOUNCER + FINISH
});

console.log('\n== active segment mapping ==');
test('segment progression through the race', () => {
  eq(Core.activeSegmentAfter(null), 'pre');
  eq(Core.activeSegmentAfter('START'), 'swim');
  eq(Core.activeSegmentAfter('SWIM'), 'transition');   // out of the water -> in T1
  eq(Core.activeSegmentAfter('T1'), 'bike');
  eq(Core.activeSegmentAfter('BIKE7'), 'bike');
  eq(Core.activeSegmentAfter('BIKE16'), 'bike');
  eq(Core.activeSegmentAfter('BIKE'), 'transition');   // bike-end mat -> in T2
  eq(Core.activeSegmentAfter('T2'), 'run');
  eq(Core.activeSegmentAfter('RUN17'), 'run');
  eq(Core.activeSegmentAfter('ANNOUNCER'), 'run');
  eq(Core.activeSegmentAfter('FINISH'), 'finished');
});
test('mapping is case-insensitive and safe on unknowns', () => {
  eq(Core.activeSegmentAfter('bike3'), 'bike');
  eq(Core.activeSegmentAfter('NOT_A_MAT'), 'unknown');
});

console.log('\n== splits normalization (fake times, real mats) ==');
test('rows sorted by course km with unmatched mats kept at the end', () => {
  const rows = Core.normalizeSplits(FAKE_MIDRACE_RESPONSE, POINTS);
  eq(rows.length, 6);
  eq(rows.map(r => r.point), ['START', 'SWIM', 'T1', 'BIKE1', 'BIKE2', 'MYSTERY_MAT']);
  eq(rows[5].matched, false);
  eq(rows[5].km, null);
});
test('rows carry the real GPS coords of their mats', () => {
  const rows = Core.normalizeSplits(FAKE_MIDRACE_RESPONSE, POINTS);
  const bike1 = rows.find(r => r.point === 'BIKE1');
  eq(bike1.lat, 45.412682);
  eq(bike1.lng, -75.764601);
  ok(Math.abs(bike1.km - 13.2288) < 0.001);
});
test('last mat = furthest matched chip read (ignores unmatched)', () => {
  const rows = Core.normalizeSplits(FAKE_MIDRACE_RESPONSE, POINTS);
  const last = Core.lastMat(rows);
  eq(last.point, 'BIKE2');
  eq(last.timeValue, '3:18:02');
  eq(Core.activeSegmentAfter(last.point), 'bike');
});
test('empty and error responses yield no rows / no last mat', () => {
  eq(Core.normalizeSplits({ error: { type: 'no_results' } }, POINTS), []);
  eq(Core.lastMat([]), null);
});
test('alternate field names (name/label, netTime/epoch) are accepted', () => {
  const rows = Core.normalizeSplits({ list: [
    { name: 'RUN5', netTime: '10:22:41' },
    { label: 'FINISH', epochTime: '1785704400' } // fake epoch: Aug 2 2026 17:00 UTC
  ] }, POINTS);
  eq(rows[0].point, 'RUN5');
  eq(rows[0].timeField, 'netTime');
  eq(rows[1].point, 'FINISH');
  eq(rows[1].timeField, 'epochTime');
  eq(Core.activeSegmentAfter(Core.lastMat(rows).point), 'finished');
});

console.log('\n== next point & progress ==');
test('next mat after BIKE7 is BIKE8', () => {
  const n = Core.nextPoint(POINTS, 'BIKE7');
  eq(n.name, 'BIKE8');
  ok(Math.abs(n.km - 82.6076) < 0.001);
});
test('next mat after ANNOUNCER is FINISH; after FINISH there is none', () => {
  eq(Core.nextPoint(POINTS, 'ANNOUNCER').name, 'FINISH');
  eq(Core.nextPoint(POINTS, 'FINISH'), null);
});
test('progress percent at swim exit / bike end / finish', () => {
  ok(Math.abs(Core.progressPercent(POINTS, 'SWIM') - 1.7) < 0.2);
  ok(Math.abs(Core.progressPercent(POINTS, 'BIKE') - 80.8) < 0.5);
  eq(Core.progressPercent(POINTS, 'FINISH'), 100);
  eq(Core.progressPercent(POINTS, null), 0);
});

console.log('\n== segment map bookmarks (real coords) ==');
test('swim view is tight around Britannia Beach', () => {
  const b = Core.segmentBounds(POINTS, 'swim');
  const [[minLat, minLng], [maxLat, maxLng]] = b;
  ok(maxLat - minLat < 0.01, 'swim lat span too wide: ' + (maxLat - minLat));
  ok(maxLng - minLng < 0.01, 'swim lng span too wide: ' + (maxLng - minLng));
  ok(minLat <= 45.365198 && maxLat >= 45.363789, 'contains START and T1');
});
test('bike view spans west Britannia to east Beacon Hill', () => {
  const [[minLat, minLng], [maxLat, maxLng]] = Core.segmentBounds(POINTS, 'bike');
  ok(minLng <= -75.80, 'reaches west to T1');
  ok(maxLng >= -75.58, 'reaches east turnaround');
  ok(maxLat >= 45.46, 'reaches Beacon Hill area');
  void minLat;
});
test('run view contains T2 and FINISH, excludes far-east bike turnaround', () => {
  const [[minLat, minLng], [maxLat, maxLng]] = Core.segmentBounds(POINTS, 'run');
  ok(minLng > -75.75 && maxLng < -75.55, 'run stays central');
  const t2 = Core.findPoint(POINTS, 'T2'), fin = Core.findPoint(POINTS, 'FINISH');
  ok(t2.lat >= minLat && t2.lat <= maxLat && t2.lng >= minLng && t2.lng <= maxLng, 'T2 inside');
  ok(fin.lat >= minLat && fin.lat <= maxLat && fin.lng >= minLng && fin.lng <= maxLng, 'FINISH inside');
  ok(maxLng < -75.57, 'BIKE6 east turnaround excluded');
});
test('every segment view is inside the full-course view', () => {
  const all = Core.segmentBounds(POINTS, 'all');
  ['swim', 'bike', 'run'].forEach(seg => {
    const b = Core.segmentBounds(POINTS, seg);
    ok(b[0][0] >= all[0][0] && b[1][0] <= all[1][0], seg + ' lat inside all');
    ok(b[0][1] >= all[0][1] && b[1][1] <= all[1][1], seg + ' lng inside all');
  });
});

console.log('\n== privacy redaction for the debug panel ==');
test('name fields are redacted recursively; timing data survives', () => {
  const resp = {
    list: [{ name: 'Real Person', fname: 'Real', lname: 'Person', bib: '1597', tag: 'ST43737', point: 'SWIM', time: '2:31:55' }],
    info: { cacheVer: '0~0' }
  };
  const red = Core.redactPII(resp);
  eq(red.list[0].name, '■■■');
  eq(red.list[0].fname, '■■■');
  eq(red.list[0].lname, '■■■');
  eq(red.list[0].bib, '1597');
  eq(red.list[0].tag, 'ST43737');
  eq(red.list[0].time, '2:31:55');
  // original untouched
  eq(resp.list[0].fname, 'Real');
});

console.log('\n== formatting ==');
test('km formatting', () => {
  eq(Core.formatKm(79.3728), '79.4 km');
  eq(Core.formatKm(0), '0.0 km');
  eq(Core.formatKm(null), '—');
});
test('time formatting passes elapsed strings through, converts epochs to ET', () => {
  eq(Core.formatTimeValue('2:31:55'), '2:31:55');
  eq(Core.formatTimeValue(null), '—');
  const s = Core.formatTimeValue('1785704400', 'America/Toronto'); // 2026-08-02 21:00 UTC = 5:00 p.m. ET
  ok(/5:00:00/.test(s) && /ET$/.test(s), 'got ' + s);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed ? 1 : 0);
