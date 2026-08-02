// Official course timing points for IRONMAN Canada-Ottawa 2026 (event IRM-OTTAWA-2026),
// captured from the RTRT.me public API endpoint /events/IRM-OTTAWA-2026/points.
// Each entry is a physical timing-mat / checkpoint location where the athlete's
// RFID chip is recorded. km is cumulative course distance at that mat.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.COURSE_POINTS = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  return [
    { name: 'START', label: 'START', segment: 'swim', km: 0.0, lat: 45.365198, lng: -75.805366, isStart: true, isFinish: false },
    { name: 'SWIM', label: 'Swim', segment: 'swim', km: 3.8624, lat: 45.364976, lng: -75.805739, isStart: false, isFinish: false },
    { name: 'T1', label: 'T1', segment: 'transition', km: 4.2004, lat: 45.363789, lng: -75.802396, isStart: false, isFinish: false },
    { name: 'BIKE1', label: 'Bike 5.6mi | 9km', segment: 'bike', km: 13.2288, lat: 45.412682, lng: -75.764601, isStart: false, isFinish: false },
    { name: 'BIKE2', label: 'Bike 10mi | 16.3km', segment: 'bike', km: 20.4226, lat: 45.363718, lng: -75.78254, isStart: false, isFinish: false },
    { name: 'BIKE3', label: 'Bike 16.3mi | 26.5km', segment: 'bike', km: 30.4649, lat: 45.419071, lng: -75.708139, isStart: false, isFinish: false },
    { name: 'BIKE4', label: 'Bike 22mi | 35.6km', segment: 'bike', km: 39.8795, lat: 45.370193, lng: -75.698457, isStart: false, isFinish: false },
    { name: 'BIKE5', label: 'Bike 27.5mi | 44.5km', segment: 'bike', km: 48.747, lat: 45.430968, lng: -75.698012, isStart: false, isFinish: false },
    { name: 'BIKE6', label: 'Bike 37.2mi | 60km', segment: 'bike', km: 63.891, lat: 45.453723, lng: -75.575479, isStart: false, isFinish: false },
    { name: 'BIKE7', label: 'Bike 46.5mi | 75km', segment: 'bike', km: 79.3728, lat: 45.431241, lng: -75.698248, isStart: false, isFinish: false },
    { name: 'BIKE8', label: 'Bike 48.7mi | 78.3km', segment: 'bike', km: 82.6076, lat: 45.419203, lng: -75.70808, isStart: false, isFinish: false },
    { name: 'BIKE9', label: 'Bike 54.5mi | 87km', segment: 'bike', km: 92.0223, lat: 45.370272, lng: -75.698565, isStart: false, isFinish: false },
    { name: 'BIKE10', label: 'Bike 59.7mi | 96km', segment: 'bike', km: 100.3004, lat: 45.426395, lng: -75.695099, isStart: false, isFinish: false },
    { name: 'BIKE11', label: 'Bike 69mi | 111km', segment: 'bike', km: 115.3724, lat: 45.45883, lng: -75.573503, isStart: false, isFinish: false },
    { name: 'BIKE12', label: 'Bike 78.7mi | 127km', segment: 'bike', km: 130.8995, lat: 45.436281, lng: -75.698053, isStart: false, isFinish: false },
    { name: 'BIKE13', label: 'Bike 80.7mi | 130km', segment: 'bike', km: 134.2004, lat: 45.421295, lng: -75.713051, isStart: false, isFinish: false },
    { name: 'BIKE14', label: 'Bike 87mi | 139km', segment: 'bike', km: 144.165, lat: 45.370345, lng: -75.698665, isStart: false, isFinish: false },
    { name: 'BIKE15', label: 'Bike 92.5mi | 149km', segment: 'bike', km: 153.2004, lat: 45.432452, lng: -75.699201, isStart: false, isFinish: false },
    { name: 'BIKE16', label: 'Bike 101mi | 163km', segment: 'bike', km: 167.1004, lat: 45.462281, lng: -75.572841, isStart: false, isFinish: false },
    { name: 'BIKE', label: 'BIKE', segment: 'bike', km: 183.8354, lat: 45.429786, lng: -75.697449, isStart: false, isFinish: false },
    { name: 'T2', label: 'T2', segment: 'transition', km: 184.109, lat: 45.428867, lng: -75.698909, isStart: false, isFinish: false },
    { name: 'RUN1', label: 'Run 1.1mi | 1.77km', segment: 'run', km: 185.8793, lat: 45.420931, lng: -75.70389, isStart: false, isFinish: false },
    { name: 'RUN2', label: 'Run 2.9mi | 4.7km', segment: 'run', km: 188.8727, lat: 45.421347, lng: -75.687651, isStart: false, isFinish: false },
    { name: 'RUN3', label: 'Run 4.4mi | 7.1km', segment: 'run', km: 191.2545, lat: 45.403338, lng: -75.681639, isStart: false, isFinish: false },
    { name: 'RUN4', label: 'Run 6.3mi | 10.2km', segment: 'run', km: 194.3444, lat: 45.395991, lng: -75.707009, isStart: false, isFinish: false },
    { name: 'RUN5', label: 'Run 8mi | 12.8km', segment: 'run', km: 196.9838, lat: 45.388572, lng: -75.725757, isStart: false, isFinish: false },
    { name: 'RUN6', label: 'Run 9.2mi | 14.8km', segment: 'run', km: 198.915, lat: 45.390167, lng: -75.707331, isStart: false, isFinish: false },
    { name: 'RUN7', label: 'Run 9.9mi | 15.9km', segment: 'run', km: 200.0415, lat: 45.395988, lng: -75.707011, isStart: false, isFinish: false },
    { name: 'RUN8', label: 'Run 11.8mi | 18.9km', segment: 'run', km: 203.0993, lat: 45.403338, lng: -75.681639, isStart: false, isFinish: false },
    { name: 'RUN9', label: 'Run 13.7mi | 22km', segment: 'run', km: 206.157, lat: 45.421783, lng: -75.690161, isStart: false, isFinish: false },
    { name: 'RUN10', label: 'Run 15.2mi | 24.5km', segment: 'run', km: 208.571, lat: 45.403338, lng: -75.681639, isStart: false, isFinish: false },
    { name: 'RUN11', label: 'Run 17.1mi | 27.5km', segment: 'run', km: 211.6288, lat: 45.395988, lng: -75.707011, isStart: false, isFinish: false },
    { name: 'RUN12', label: 'Run 18.7mi | 30km', segment: 'run', km: 214.2037, lat: 45.388569, lng: -75.725758, isStart: false, isFinish: false },
    { name: 'RUN13', label: 'Run 20mi | 32.1km', segment: 'run', km: 216.2959, lat: 45.390435, lng: -75.703693, isStart: false, isFinish: false },
    { name: 'RUN14', label: 'Run 20.7mi | 33.3km', segment: 'run', km: 217.4224, lat: 45.395988, lng: -75.707011, isStart: false, isFinish: false },
    { name: 'RUN15', label: 'Run 22.5mi | 36.2km', segment: 'run', km: 220.3192, lat: 45.403338, lng: -75.681639, isStart: false, isFinish: false },
    { name: 'RUN16', label: 'Run 24mi | 38.6km', segment: 'run', km: 222.7333, lat: 45.421348, lng: -75.687652, isStart: false, isFinish: false },
    { name: 'RUN17', label: 'Run 25.6mi | 41.2km', segment: 'run', km: 225.3082, lat: 45.423558, lng: -75.703592, isStart: false, isFinish: false },
    { name: 'ANNOUNCER', label: 'ANNOUNCER', segment: 'run', km: 227.3843, lat: 45.426897, lng: -75.696709, isStart: false, isFinish: false },
    { name: 'FINISH', label: 'FINISH', segment: 'run', km: 227.4164, lat: 45.427084, lng: -75.697022, isStart: false, isFinish: true },
  ];
}));
