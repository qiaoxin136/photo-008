import { Popup } from 'react-map-gl';
import type { WaterFeatureProperties } from './types';
import './FeaturePopup.css';

interface Props {
  longitude: number;
  latitude: number;
  properties: WaterFeatureProperties;
  onClose: () => void;
}

export function FeaturePopup({ longitude, latitude, properties, onClose }: Props) {
  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      anchor="bottom"
      offset={12}
      onClose={onClose}
      closeOnClick={false}
    >
      <div className="popup">
        <h3 className="popup-title">
          <span className="popup-type-badge">{properties.type}</span>
          Water Infrastructure
        </h3>
        <table className="popup-table">
          <tbody>
            <tr>
              <td>Survey Date</td>
              <td>{properties.survey_date}</td>
            </tr>
            <tr>
              <td>Diameter</td>
              <td>{properties.diameter} in</td>
            </tr>
            <tr>
              <td>Length</td>
              <td>{properties.length} ft</td>
            </tr>
            {properties.description && (
              <tr>
                <td>Description</td>
                <td>{properties.description}</td>
              </tr>
            )}
            <tr>
              <td>Track</td>
              <td>{properties.track}</td>
            </tr>
            <tr>
              <td>ID</td>
              <td className="popup-id">{properties.id}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Popup>
  );
}
