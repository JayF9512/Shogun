using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Mail
{
    /// <summary>
    /// Message body + claim-reward button (spec §107). Reward claiming is a
    /// server call — items are only granted after the server confirms.
    /// </summary>
    public class MailDetailUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text subjectLabel;
        [SerializeField] private TMP_Text bodyLabel;
        [SerializeField] private Button claimButton;

        private MailMessage _message;

        public void Show(MailMessage message)
        {
            _message = message;
            panel.SetActive(true);
            subjectLabel.text = message.subject;
            bodyLabel.text = message.body;
            claimButton.gameObject.SetActive(message.hasReward && !message.rewardClaimed);
            claimButton.onClick.RemoveAllListeners();
            claimButton.onClick.AddListener(Claim);
        }

        private void Claim()
        {
            // A MailService call would POST /mail/{id}/claim; the server grants
            // the reward and returns updated inventory. Placeholder toast here.
            _message.rewardClaimed = true;
            claimButton.gameObject.SetActive(false);
            ToastNotification.Instance?.Show("Reward claimed");
        }

        public void Close() => panel.SetActive(false);
    }
}
