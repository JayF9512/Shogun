using System;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Network
{
    /// <summary>
    /// Read-only catalogue of static game content served from the backend
    /// (/content/*). These definitions (heroes, troops, buildings, pets, store
    /// products, season pass) are authored server-side so balance changes ship
    /// without a client update (spec §98). The client caches and renders them.
    /// </summary>
    public class ContentService
    {
        private readonly ApiClient _api;
        public ContentService(ApiClient api) => _api = api;

        /// <summary>Fetches the entire content bundle in a single call.</summary>
        public void GetAll(Action<ApiResponse<ContentBundle>> cb)
            => _api.Get("/content", cb);

        public void GetHeroes(Action<ApiResponse<HeroDefinitionListResponse>> cb)
            => _api.Get("/content/heroes", cb);

        public void GetTroops(Action<ApiResponse<TroopDefinitionListResponse>> cb)
            => _api.Get("/content/troops", cb);

        public void GetBuildings(Action<ApiResponse<BuildingDefinitionListResponse>> cb)
            => _api.Get("/content/buildings", cb);

        public void GetPets(Action<ApiResponse<PetDefinitionListResponse>> cb)
            => _api.Get("/content/pets", cb);

        public void GetStoreProducts(Action<ApiResponse<StoreCatalog>> cb)
            => _api.Get("/content/store-products", cb);

        public void GetSeasonPass(Action<ApiResponse<SeasonPassDefinition>> cb)
            => _api.Get("/content/season-pass", cb);
    }

    // --- Response DTOs (JsonUtility-friendly wrapper objects) ------------

    [Serializable]
    public class ContentBundle
    {
        public ContentHeroDefinition[] heroes;
        public ContentTroopDefinition[] troops;
        public ContentBuildingDefinition[] buildings;
        public ContentPetDefinition[] pets;
        public StoreProduct[] storeProducts;
        public SeasonPassDefinition seasonPass;
    }

    [Serializable] public class HeroDefinitionListResponse { public ContentHeroDefinition[] heroes; }
    [Serializable] public class TroopDefinitionListResponse { public ContentTroopDefinition[] troops; }
    [Serializable] public class BuildingDefinitionListResponse { public ContentBuildingDefinition[] buildings; }
    [Serializable] public class PetDefinitionListResponse { public ContentPetDefinition[] pets; }

    [Serializable]
    public class ContentHeroDefinition
    {
        public string key;
        public string name;
        public string rarity;
        public string role;
        public string faction;
        public int baseAttack;
        public int baseDefense;
        public string iconKey;
        public string description;
    }

    [Serializable]
    public class ContentTroopDefinition
    {
        public string key;
        public string troopClass;      // SAMURAI_GUARD | YUMI_ARCHERS | KOMAINU_RIDERS
        public int tier;
        public int attack;
        public int defense;
        public string iconKey;
    }

    [Serializable]
    public class ContentBuildingDefinition
    {
        public string key;
        public string name;
        public string category;        // MILITARY | ECONOMY | SUPPORT
        public int maxLevel;
        public string iconKey;
        public string description;
    }

    [Serializable]
    public class ContentPetDefinition
    {
        public string key;
        public string name;
        public string rarity;
        public string bonusType;
        public float bonusValue;
        public string iconKey;
        public string description;
    }
}
