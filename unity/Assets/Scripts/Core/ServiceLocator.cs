using System;
using System.Collections.Generic;

namespace ShadowsOfTheShogun.Core
{
    /// <summary>
    /// Minimal service locator for dependency access without a heavy DI
    /// container. Register services (network clients, managers) at bootstrap;
    /// resolve them anywhere. Prefer constructor/field injection where possible;
    /// use this only for MonoBehaviour → plain-service access.
    /// </summary>
    public static class ServiceLocator
    {
        private static readonly Dictionary<Type, object> Services = new();

        public static void Register<T>(T service) where T : class
        {
            if (service == null) throw new ArgumentNullException(nameof(service));
            Services[typeof(T)] = service;
        }

        public static bool TryGet<T>(out T service) where T : class
        {
            if (Services.TryGetValue(typeof(T), out var obj))
            {
                service = (T)obj;
                return true;
            }
            service = null;
            return false;
        }

        public static T Get<T>() where T : class
        {
            if (Services.TryGetValue(typeof(T), out var obj)) return (T)obj;
            throw new InvalidOperationException(
                $"Service '{typeof(T).Name}' is not registered. Register it during bootstrap.");
        }

        public static bool IsRegistered<T>() where T : class => Services.ContainsKey(typeof(T));

        public static void Unregister<T>() where T : class => Services.Remove(typeof(T));

        public static void Clear() => Services.Clear();
    }
}
