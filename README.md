# SCARLET.exe

A silent, local webcam instrument. Run `npm ci` then `npm run dev -- --port 3005`. Open http://localhost:3005 and click **Enter Experience**. The camera, models and rendering run locally; the browser requests video only.

**Early Wanda — Soft Magic** is the default: 35% intensity, 15% particle density, 30% glow, 40% smoke, 25% core, 45% motion and 65% eye glow. VFX settings includes the optional Max Chaos preset. Beauty, mirror, fullscreen, hide UI and PNG capture work in either mode.

- Face an open palm toward the lens for drifting finger wisps. Turn it away to fade them.
- Turn both palms toward each other and hold for about one third of a second. Both hands must remain visible; a slight stagger can help if one hides the other. Move them together to compress the orb, or apart to stretch and dissolve it.
- Raise **both** hands above your shoulders for 0.4 seconds to light both irises. This works independently of the orb and of palm visibility. Lower either hand to fade the eyes.

## Developer diagnostics

Press **Shift+D** in camera mode to show or hide gesture diagnostics. There is no skeleton overlay. H hides all controls; Escape restores them. The panel shows each hand's detection and signed orientation, mutual facing, orb state, face and iris tracking, eye trigger, and the highest-priority gesture. If no face or model is available the panel names the issue. FALLBACK means eye-contour landmarks supply the iris positions.

The local worker returns image and world hand landmarks plus handedness. Gesture recognition operates on the original camera frame; mirroring applies only during display. Each signed normal uses index-to-pinky span and wrist-to-middle direction. Hand-local world origins are not directly comparable, so projected bone lengths give a weak-perspective estimate of the two palm centers in camera space. Short holds, smoothed normals and separate entry/exit thresholds reject transient poses. Shoulders come from the pose model or a face-height estimate.

## Checks

Run `npm run build` and `node tests/gestures.mjs` (Node 22.18+). Tests cover signed normal classification, gradual palm fading, inward and outward normals, hold timing, distance release, orb priority and independent eye activation. The normal fixtures are landmarks inferred from the public MediaPipe victory and right_hands images. The sideways tests rotate the measured 3D points; they do not establish tracking reliability for a person's edge-on hands. Use the debug panel to verify physical turns, spacing and shoulder framing on your own webcam.
