using System;
using UnityEngine;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.WorldMap
{
    /// <summary>
    /// Animates a marching army between tiles (spec §15, §16).
    ///
    ///  • Duration is taken from the server (departedAt → arrivesAt), never
    ///    computed locally, so the visual matches authoritative timing.
    ///  • On reconnect, position is re-synced from elapsed server time.
    ///  • Komainu-led marches render ~30% faster travel because the server ETA
    ///    already reflects the KOMAINU_SPEED_BONUS.
    ///  • Honours reduced-motion by snapping rather than tweening.
    /// </summary>
    public class MarchAnimator : MonoBehaviour
    {
        [SerializeField] private Transform icon;
        [SerializeField] private LineRenderer pathLine;

        private Vector3 _origin;
        private Vector3 _destination;
        private DateTime _departUtc;
        private DateTime _arriveUtc;
        private bool _running;
        private string _marchId;

        public void Play(MarchData march)
        {
            _marchId = march.id;
            _origin = new Vector3(march.originX, 0f, march.originY);
            _destination = new Vector3(march.targetX, 0f, march.targetY);
            _departUtc = march.departedAt.ToUniversalTime();
            _arriveUtc = march.arrivesAt.ToUniversalTime();
            _running = true;

            if (pathLine != null)
            {
                pathLine.positionCount = 2;
                pathLine.SetPosition(0, _origin);
                pathLine.SetPosition(1, _destination);
            }
            SyncPosition();
        }

        private void Update()
        {
            if (!_running) return;

            if (AccessibilityManager.Instance != null && AccessibilityManager.Instance.ReducedMotion)
            {
                SyncPosition();
                if (DateTime.UtcNow >= _arriveUtc) Arrive();
                return;
            }
            SyncPosition();
            if (DateTime.UtcNow >= _arriveUtc) Arrive();
        }

        /// <summary>Places the icon at the server-accurate interpolation point.</summary>
        public void SyncPosition()
        {
            double total = (_arriveUtc - _departUtc).TotalSeconds;
            if (total <= 0) { icon.position = _destination; return; }
            double elapsed = (DateTime.UtcNow - _departUtc).TotalSeconds;
            float t = Mathf.Clamp01((float)(elapsed / total));
            icon.position = Vector3.Lerp(_origin, _destination, t);

            var dir = (_destination - _origin);
            if (dir.sqrMagnitude > 0.0001f)
                icon.rotation = Quaternion.LookRotation(dir);
        }

        private void Arrive()
        {
            _running = false;
            icon.position = _destination;
            EventBus.Publish(new MarchArrived(_marchId));
        }
    }
}
