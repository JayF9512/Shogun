using UnityEngine;

namespace ShadowsOfTheShogun.Clan
{
    /// <summary>
    /// Overlays clan-owned territory on the world map (spec §18). Tiles owned by
    /// the player's clan are tinted; contested/enemy tiles use distinct colours.
    /// </summary>
    public class ClanTerritoryUI : MonoBehaviour
    {
        [SerializeField] private Color ownedColor = new(0.2f, 0.6f, 1f, 0.35f);
        [SerializeField] private Color enemyColor = new(1f, 0.3f, 0.2f, 0.35f);
        [SerializeField] private GameObject overlayTilePrefab;
        [SerializeField] private Transform overlayRoot;

        public void Render(Vector2Int[] ownedTiles, Vector2Int[] enemyTiles)
        {
            foreach (Transform c in overlayRoot) Destroy(c.gameObject);
            Paint(ownedTiles, ownedColor);
            Paint(enemyTiles, enemyColor);
        }

        private void Paint(Vector2Int[] tiles, Color color)
        {
            if (tiles == null) return;
            foreach (var t in tiles)
            {
                var go = Instantiate(overlayTilePrefab, overlayRoot);
                go.transform.position = new Vector3(t.x, 0.01f, t.y);
                var r = go.GetComponentInChildren<Renderer>();
                if (r != null) r.material.color = color;
            }
        }
    }
}
