using UnityEngine;

namespace ShadowsOfTheShogun.WorldMap
{
    public enum TileKind { Empty, Resource, MonsterCamp, EnemyCity, ClanTerritory, Wonder }

    /// <summary>Renders a single world-map tile and holds its coordinate/kind.</summary>
    public class WorldTileView : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer sprite;
        [SerializeField] private GameObject selectionHighlight;

        public Vector2Int Coord { get; private set; }
        public TileKind Kind { get; private set; }
        public string OwnerId { get; private set; }

        public void Bind(int x, int y, TileKind kind, string ownerId = null)
        {
            Coord = new Vector2Int(x, y);
            Kind = kind;
            OwnerId = ownerId;
            transform.position = new Vector3(x, 0f, y);
        }

        public void SetSelected(bool selected)
        {
            if (selectionHighlight != null) selectionHighlight.SetActive(selected);
        }
    }
}
