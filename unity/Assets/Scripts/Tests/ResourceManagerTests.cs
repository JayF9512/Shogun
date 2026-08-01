using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Economy;
using ShadowsOfTheShogun.Network;

namespace ShadowsOfTheShogun.Tests
{
    /// <summary>
    /// EditMode tests for the optimistic-update + rollback behaviour of
    /// ResourceManager (spec §98). A throwaway GameObject provides the coroutine
    /// host; no network calls are made in these paths.
    /// </summary>
    public class ResourceManagerTests
    {
        private GameObject _host;
        private ResourceManager _rm;

        [SetUp]
        public void SetUp()
        {
            _host = new GameObject("test-host");
            var runner = _host.AddComponent<TestRunner>();
            _rm = new ResourceManager(runner, new EconomyService(new ApiClient(runner, "http://localhost")));
            _rm.SetActiveSettlement("settlement-1");
            _rm.LoadSnapshot(new[]
            {
                new ResourceData { resource = "RICE", amount = 1000, capacity = 5000 },
                new ResourceData { resource = "WOOD", amount = 500, capacity = 5000 },
            });
        }

        [TearDown]
        public void TearDown() => Object.DestroyImmediate(_host);

        [Test]
        public void LoadSnapshot_PopulatesCache()
        {
            Assert.AreEqual(1000, _rm.Get("RICE"));
            Assert.AreEqual(500, _rm.Get("WOOD"));
            Assert.AreEqual(0, _rm.Get("STONE"));
        }

        [Test]
        public void CanAfford_ReflectsCache()
        {
            Assert.IsTrue(_rm.CanAfford("RICE", 1000));
            Assert.IsFalse(_rm.CanAfford("RICE", 1001));
        }

        [Test]
        public void SpendOptimistic_DebitsImmediately()
        {
            _rm.SpendOptimistic(new Dictionary<string, long> { ["RICE"] = 300 }, null);
            Assert.AreEqual(700, _rm.Get("RICE"));
        }

        [Test]
        public void Rollback_RestoresPreviousValues()
        {
            _rm.SpendOptimistic(new Dictionary<string, long> { ["RICE"] = 300, ["WOOD"] = 200 }, null);
            Assert.AreEqual(700, _rm.Get("RICE"));
            Assert.AreEqual(300, _rm.Get("WOOD"));

            _rm.RollbackLastSpend();
            Assert.AreEqual(1000, _rm.Get("RICE"));
            Assert.AreEqual(500, _rm.Get("WOOD"));
        }

        [Test]
        public void Commit_PreventsRollback()
        {
            _rm.SpendOptimistic(new Dictionary<string, long> { ["RICE"] = 300 }, null);
            _rm.CommitLastSpend();
            _rm.RollbackLastSpend(); // should be a no-op for the spend
            Assert.AreEqual(700, _rm.Get("RICE"));
        }

        /// <summary>Minimal MonoBehaviour to host coroutines in EditMode.</summary>
        private class TestRunner : MonoBehaviour { }
    }
}
