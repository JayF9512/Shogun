using System;
using System.Collections;
using UnityEngine;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Settlement
{
    /// <summary>
    /// Server-synced construction countdown (spec §98):
    ///  • Reads the authoritative end time from the server-provided BuildingData.
    ///  • Counts down locally with no server calls while running.
    ///  • On reaching zero, asks the server to claim completion — progress is
    ///    NEVER granted client-side.
    /// </summary>
    public class ConstructionTimer : MonoBehaviour
    {
        [SerializeField] private GameObject root;
        [SerializeField] private TimerDisplay timerDisplay;

        private string _buildingId;
        private DateTime _endsAtUtc;
        private Coroutine _loop;

        public void Begin(string buildingId, DateTime endsAtUtc)
        {
            _buildingId = buildingId;
            _endsAtUtc = endsAtUtc.ToUniversalTime();
            root.SetActive(true);
            if (_loop != null) StopCoroutine(_loop);
            _loop = StartCoroutine(Tick());
        }

        public void Hide()
        {
            if (_loop != null) StopCoroutine(_loop);
            root.SetActive(false);
        }

        private IEnumerator Tick()
        {
            while (true)
            {
                var remaining = (_endsAtUtc - DateTime.UtcNow).TotalSeconds;
                if (remaining <= 0)
                {
                    timerDisplay.SetSeconds(0);
                    ClaimCompletion();
                    yield break;
                }
                timerDisplay.SetSeconds(remaining);
                yield return new WaitForSeconds(1f);
            }
        }

        private void ClaimCompletion()
        {
            var settlements = ServiceLocator.Get<SettlementService>();
            settlements.ClaimConstruction(_buildingId, res =>
            {
                if (res.Success)
                {
                    Hide();
                    EventBus.Publish(new ConstructionCompleted(_buildingId));
                }
                else
                {
                    // Server says not done yet — re-check shortly.
                    if (isActiveAndEnabled) _loop = StartCoroutine(Retry());
                }
            });
        }

        private IEnumerator Retry()
        {
            yield return new WaitForSeconds(3f);
            _loop = StartCoroutine(Tick());
        }
    }
}
