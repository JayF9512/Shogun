using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Mail
{
    /// <summary>System/player mail item (spec §107).</summary>
    [Serializable]
    public class MailMessage
    {
        public string id;
        public string subject;
        public string body;
        public bool read;
        public bool hasReward;
        public bool rewardClaimed;
        public string receivedAtIso;
    }

    /// <summary>Inbox list; tapping a message opens MailDetailUI.</summary>
    public class MailboxUI : ScreenView
    {
        [SerializeField] private Transform container;
        [SerializeField] private GameObject rowPrefab;
        [SerializeField] private MailDetailUI detail;

        public void Populate(List<MailMessage> messages)
        {
            foreach (Transform c in container) Destroy(c.gameObject);
            foreach (var m in messages)
            {
                var row = Instantiate(rowPrefab, container);
                var label = row.GetComponentInChildren<TMP_Text>();
                if (label != null) label.text = (m.read ? "" : "● ") + m.subject;
                var button = row.GetComponentInChildren<Button>();
                if (button != null) button.onClick.AddListener(() => detail.Show(m));
            }
        }
    }
}
