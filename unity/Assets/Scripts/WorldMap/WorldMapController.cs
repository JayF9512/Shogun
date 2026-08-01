using UnityEngine;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.WorldMap
{
    /// <summary>
    /// World-map camera controller (spec §14, §17): drag to pan, pinch/scroll to
    /// zoom, tap to select a tile. Emits the selected tile coordinate to
    /// interested UI (march/scout/rally panels).
    /// </summary>
    public class WorldMapController : ScreenView
    {
        [SerializeField] private Camera mapCamera;
        [SerializeField] private float panSpeed = 1f;
        [SerializeField] private float zoomSpeed = 5f;
        [SerializeField] private float minZoom = 5f;
        [SerializeField] private float maxZoom = 40f;

        public System.Action<Vector2Int> OnTileSelected;

        private Vector3 _lastPointer;

        private void Update()
        {
            HandlePan();
            HandleZoom();
            HandleSelect();
        }

        private void HandlePan()
        {
            if (Input.GetMouseButtonDown(0)) _lastPointer = Input.mousePosition;
            else if (Input.GetMouseButton(0))
            {
                var delta = Input.mousePosition - _lastPointer;
                mapCamera.transform.Translate(-delta.x * panSpeed * Time.deltaTime,
                                              -delta.y * panSpeed * Time.deltaTime, 0);
                _lastPointer = Input.mousePosition;
            }
        }

        private void HandleZoom()
        {
            float scroll = Input.GetAxis("Mouse ScrollWheel");
            if (Mathf.Abs(scroll) > 0.001f && mapCamera.orthographic)
                mapCamera.orthographicSize = Mathf.Clamp(
                    mapCamera.orthographicSize - scroll * zoomSpeed, minZoom, maxZoom);
        }

        private void HandleSelect()
        {
            if (!Input.GetMouseButtonUp(0)) return;
            var ray = mapCamera.ScreenPointToRay(Input.mousePosition);
            if (Physics.Raycast(ray, out var hit))
            {
                var tile = hit.collider.GetComponent<WorldTileView>();
                if (tile != null) OnTileSelected?.Invoke(tile.Coord);
            }
        }
    }
}
