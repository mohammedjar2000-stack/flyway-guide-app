import { createLayerComponent, extendContext } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { makeClusterIcon } from '@/lib/mapIcons';

type ClusterProps = L.MarkerClusterGroupOptions & { children?: React.ReactNode };

const MarkerClusterGroup = createLayerComponent<L.MarkerClusterGroup, ClusterProps>(
  (props, context) => {
    const { children: _children, ...options } = props;
    const instance = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 14,
      maxClusterRadius: 42,
      iconCreateFunction: makeClusterIcon,
      animate: false,
      chunkedLoading: true,
      removeOutsideVisibleBounds: false,
      spiderfyOnEveryZoom: false,
      ...options,
    });

    return {
      instance,
      context: extendContext(context, { layerContainer: instance }),
    };
  },
);

export default MarkerClusterGroup;
