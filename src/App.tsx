import type { ChangeEvent, SyntheticEvent } from "react";
import { useEffect, useState, useCallback } from "react";
import type { Schema } from "../amplify/data/resource";
import { checkLoginAndGetName } from "./utils/AuthUtils";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from "aws-amplify/data";
import "@aws-amplify/ui-react/styles.css";
import './App.css';
import { uploadData, remove } from "aws-amplify/storage";
import type { MapMouseEvent } from "mapbox-gl";

import 'mapbox-gl/dist/mapbox-gl.css';
//import { useGeoJSON } from './useGeoJSON';

import type { WaterFeatureProperties } from './types';
import './MapView.css';

//import { MapboxOverlay, MapboxOverlayProps } from "@deck.gl/mapbox/typed";
//import { PickingInfo } from "@deck.gl/core/typed";

import "maplibre-gl/dist/maplibre-gl.css"; // Import maplibre-gl styles

import {
  Map,
  Source,
  Layer,
  //useControl,
  //Popup,
  Marker,
  NavigationControl,
  GeolocateControl,
  ScaleControl,
  Popup
} from "react-map-gl";



import {
  Input,
  Flex,
  Button,
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
  ThemeProvider,
  Theme,
  Divider,
  Tabs,
  SelectField,
  ScrollView,
  Radio,
  RadioGroupField,
  //CheckboxField,
  // TextField,
} from "@aws-amplify/ui-react";

//import { IconLayer } from "@deck.gl/layers/typed";


//import type { WaterFeatureProperties } from './types';
import './FeaturePopup.css';

const MAPBOX_TOKEN = "pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmMnY0NzE1MGMzMjNycGp6bDQwcWZsNyJ9.1JJeWIQgrykU5b3oqSr1sQ";

const client = generateClient<Schema>();



const theme: Theme = {
  name: "table-theme",
  tokens: {
    components: {
      table: {
        row: {
          hover: {
            backgroundColor: { value: "{colors.blue.20}" },
          },

          striped: {
            backgroundColor: { value: "{colors.orange.10}" },
          },
        },

        header: {
          color: { value: "{colors.blue.80}" },
          fontSize: { value: "{fontSizes.x3}" },
          borderColor: { value: "{colors.blue.20}" },
        },

        data: {
          fontWeight: { value: "{fontWeights.semibold}" },
        },
      },
    },
  },
};

// type DataT = {
//   type: "Feature";
//   id: number;
//   geometry: {
//     type: "Point";
//     coordinates: [number, number, number];
//   };
//   properties: {
//     track: number;
//     type: string;
//     status: string;
//     date: string;
//     time: string;
//     id: string;
//   };
// };

type SelectOption = {
  value: string;
  label: string;
};

const AIR_PORTS =
  "https://iwuyhcysnc.execute-api.us-east-1.amazonaws.com/test/getData";



// Hong's addition
export type CustomEvent = {
  target: HTMLInputElement
}
// Hong's addition end

//const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
// "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";


interface PopupInfo {
  longitude: number;
  latitude: number;
  properties: WaterFeatureProperties;
}



type LocationItem = Schema["Location"]["type"];


type AggRow = { type: string; track: number; diameter: number; length: number; price: number; cost: number };

function buildCostRows(records: LocationItem[], typeFilter: string, priceMap: Record<number, number>): AggRow[] {
  const aggregated: Record<string, AggRow> = {};
  records
    .filter(e => (e.type ?? "").toLowerCase() === typeFilter)
    .forEach(e => {
      const dia = parseInt(String(e.diameter ?? 0));
      const price = parseInt(String(priceMap[dia] ?? 0));
      const length = e.length ?? 0;
      const cost = length * price;
      const key = `${typeFilter}|${e.track ?? 0}|${dia}`;
      if (aggregated[key]) {
        aggregated[key].length += length;
        aggregated[key].cost += cost;
      } else {
        aggregated[key] = { type: e.type ?? "", track: e.track ?? 0, diameter: dia, length, price, cost };
      }
    });
  return Object.values(aggregated).sort((a, b) => a.track - b.track || a.diameter - b.diameter);
}


function CostTable({ rows, title }: { rows: AggRow[]; title: string }) {
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  return (
    <div className="cost-table-section">
      <h3>{title}</h3>
      <Table caption="" highlightOnHover={false} variation="striped" className="cost-table">
        <TableHead>
          <TableRow>
            <TableCell as="th" className="cost-th-type">Type</TableCell>
            <TableCell as="th" className="cost-th-track">Track</TableCell>
            <TableCell as="th" className="cost-th-dia">Diameter (in)</TableCell>
            <TableCell as="th" className="cost-th-len">Length (ft)</TableCell>
            <TableCell as="th" className="cost-th-price">Price ($/ft)</TableCell>
            <TableCell as="th" className="cost-th-cost">Cost ($)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="cell-text">{r.type}</TableCell>
              <TableCell className="cell-num">{r.track}</TableCell>
              <TableCell className="cell-num">{r.diameter}</TableCell>
              <TableCell className="cell-num">{Math.round(r.length)}</TableCell>
              <TableCell className="cell-num">{r.price}</TableCell>
              <TableCell className="cell-num">${r.cost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={5} className="cell-text"><strong>Total Cost</strong></TableCell>
            <TableCell className="cell-num"><strong>${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

const MH_UNIT_COST = 1500;

function MHTable({ records }: { records: LocationItem[] }) {
  const wastewaterMH = records.filter(e => (e.type ?? "").toLowerCase() === "wastewater" && e.joint === false).length;
  const stormwaterMH = records.filter(e => (e.type ?? "").toLowerCase() === "stormwater" && e.joint === false).length;
  const rows = [
    { type: "Wastewater", count: wastewaterMH, unitCost: MH_UNIT_COST, totalCost: wastewaterMH * MH_UNIT_COST },
    { type: "Stormwater", count: stormwaterMH, unitCost: MH_UNIT_COST, totalCost: stormwaterMH * MH_UNIT_COST },
  ];
  const totalCost = rows.reduce((s, r) => s + r.totalCost, 0);

  return (
    <div className="cost-table-section">
      <h3>Manholes (MH)</h3>
      <Table caption="" highlightOnHover={false} variation="striped" className="cost-table">
        <TableHead>
          <TableRow>
            <TableCell as="th" className="mh-th-type">Type</TableCell>
            <TableCell as="th" className="mh-th-count">MH Count</TableCell>
            <TableCell as="th" className="mh-th-unit">Unit Cost ($)</TableCell>
            <TableCell as="th" className="mh-th-total">Total Cost ($)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="cell-text">{r.type}</TableCell>
              <TableCell className="cell-num">{r.count}</TableCell>
              <TableCell className="cell-num">${r.unitCost.toLocaleString('en-US')}</TableCell>
              <TableCell className="cell-num">${r.totalCost.toLocaleString('en-US')}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} className="cell-text"><strong>Total Cost</strong></TableCell>
            <TableCell className="cell-num"><strong>${totalCost.toLocaleString('en-US')}</strong></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function WaterCostDetailTab({ records, priceMap }: { records: LocationItem[]; priceMap: Record<number, number> }) {
  const waterRows = buildCostRows(records, "water", priceMap);
  const wastewaterRows = buildCostRows(records, "wastewater", priceMap);
  const stormwaterRows = buildCostRows(records, "stormwater", priceMap);

  return (
    <ThemeProvider theme={theme} colorMode="light">
      <CostTable rows={waterRows} title="Water" />
      <CostTable rows={wastewaterRows} title="Wastewater" />
      <CostTable rows={stormwaterRows} title="Stormwater" />
      <MHTable records={records} />
    </ThemeProvider>
  );
}


function App() {

  const { signOut } = useAuthenticator();
  //const client = generateClient<Schema>();
  const [location, setLocation] = useState<Array<Schema["Location"]["type"]>>([]);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  //const [report, setReport] = useState("");
  const [track, setTrack] = useState<number>(0);
  const [type, setType] = useState<string>("water");
  const [diameter, setDiameter] = useState<number>(0);
  const [length, setLength] = useState<number>(0);
  const [userName, setUserName] = useState<string>();
  const [description, setDescription] = useState<string>("");
  const [joint, setJoint] = useState<boolean>(true);
  const [priceMap, setPriceMap] = useState<Record<number, number>>({});
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [placePhotos, setPlacePhotos] = useState<File[]>([]);

  const [tab, setTab] = useState("1");
  const [basemap, setBasemap] = useState("mapbox://styles/mapbox/streets-v12");

  //const [clickInfo, setClickInfo] = useState<DataT>();
  //const [showPopup, setShowPopup] = useState<boolean>(true);




  //const { data } = useGeoJSON();
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [cursor, setCursor] = useState<string>('grab');
  const [calResult, setCalResult] = useState<string>("");



  const options: SelectOption[] = [
    { value: 'water', label: 'Water' },
    { value: 'wastewater', label: 'Wastewater' },
    { value: 'stormwater', label: 'Stormwater' },
    { value: 'pavement', label: 'Pavement' }
  ];

  //console.log(AIR_PORTS);


  const handleDate = (e: ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleTime = (e: ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
  };

  const handleTrack = (e: ChangeEvent<HTMLInputElement>) => {
    setTrack(parseInt(e.target.value));
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    //console.log(value);
    setType(value);
  }

  const handleDiameter = (e: ChangeEvent<HTMLInputElement>) => {
    setDiameter(parseInt(e.target.value));
  }

  // const handleLength = (e: ChangeEvent<HTMLInputElement>) => {
  //   setLength(parseInt(e.target.value));
  // }

  const handleUserName = async () => {
    const name = await checkLoginAndGetName();
    //console.log((name));
    if (name) {
      setUserName(name)
    }
  }

  const handleDescription = (e: ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  }

  const handleJoint = (e: ChangeEvent<HTMLInputElement>) => {
    setJoint(e.target.checked);
  }

  useEffect(() => {

    client.models.Location.observeQuery().subscribe({
      next: (data) => setLocation([...data.items]),
    });
  }, []);

  useEffect(() => {
    handleUserName();
  }, []);

  useEffect(() => {
    fetch("https://50fb42daa5.execute-api.us-east-1.amazonaws.com/test/getData")
      .then(r => r.text())
      .then(text => {
        // API returns malformed JSON; each inner object is valid JSON, so parse them individually
        const blocks = text.match(/\{[^{}]*"diameter"[^{}]*"price"[^{}]*\}/g) ?? [];
        const map: Record<number, number> = {};
        blocks.forEach(block => {
          try {
            const item: { diameter: string | number; price: string | number } = JSON.parse(block);
            map[parseInt(String(item.diameter))] = parseInt(String(item.price));
          } catch {}
        });
        setPriceMap(map);
      })
      .catch(e => console.error("price fetch error:", e));
  }, []);



  function createLocation() {
    handleUserName();
    //console.log(typeof userName);
    //console.log("Username:", userName);
    const name = userName
    //console.log(name);
    client.models.Location.create({
      date: date,
      time: time ? time.slice(0, 5) : time,
      track: track,
      type: type,
      diameter: diameter,
      length: length,
      username: name,
      description: description,
      joint: joint,
      lat: lat,
      lng: lng,

    });
    setDate("");
    setTime("");
    setTrack(track);
    setType(type);
    setDiameter(diameter);
    setUserName("");
    setDescription("");
    setJoint(joint);
    setLat(0);
    setLng(0);
  }

  async function deleteLocation2(id: string, photourls: (string | null)[]):
    Promise<{
      response: number
      info: string
    }> {
    console.log('called delete location ')
    console.log("id=", id)
    console.log("photourl=", photourls)

    for (const aPath of photourls) {
      if (aPath) {
        try {
          await remove({ path: aPath });
        } catch (error) {
          console.error('Error deleting photos:', error);
          return { response: 299, info: 'failed' };
        }
      }
    }

    await client.models.Location.delete({ id });

    return { response: 200, info: 'success' };
    /*
    const result = await deleteLocationPhotos(id)
    if (result.response == 200 ) {
      client.models.Location.delete({ id })
    }else {
      console.log(" error to delete photos ")
    }*/
  }

  async function deleteLocation(id: string) {
    const result = await deleteLocationPhotos(id)
    console.log("result =", result.response)
    if (result.response == 200) {
      client.models.Location.delete({ id })
    } else {
      console.log(" error to delete photos ")
    }
  }





  async function handleSubmit(event: SyntheticEvent, id: string) {
    event.preventDefault();

    if (placePhotos.length === 0) return;

    const uploadResult = await uploadPhotos(placePhotos, id);
    const placePhotosUrls = uploadResult.urls;

    const currentLoc = await client.models.Location.get({ id });
    const revised: string[] = [];
    if (currentLoc.data?.photos) {
      currentLoc.data.photos.forEach(d => { if (d) revised.push(d); });
    }

    await client.models.Location.update({
      id,
      photos: [...placePhotosUrls, ...revised],
    });

    clearFields();
  }

  function clearFields() {
    //setuserName('');
    setPlacePhotos([]);
  }

  async function uploadPhotos(files: File[], id: string): Promise<{
    urls: string[]

  }> {
    const urls: string[] = [];
    console.log('start to upload photos')
    console.log('# of files', files.length)

    for (const file of files) {
      console.log(`uploading file ${file.name}`)
      const result = await uploadData({
        data: file,
        path: `originals/${id}/${file.name}`
      }).result
      urls.push(result.path);
      console.log('url is ', urls);

    }
    return {
      urls,

    };
  }

  //Hong's addition
  function previewPhotos(event: ChangeEvent<HTMLInputElement>) {

    if (event.target.files) {
      const eventPhotos = Array.from(event.target.files);
      //const newFiles: File[] = [...new Set([...eventPhotos, ...placePhotos])]
      //console.log("newFiles =", newFiles)
      //setPlacePhotos(newFiles);
      setPlacePhotos(eventPhotos)
    }
  }


  async function deleteLocationPhotos(locId: string): Promise<{
    response: number
    info: string
  }> {
    console.log("Loc Id = " + locId)
    if (location) {
      try {

        await remove({ path: `originals/${locId}` })
      } catch (error) {
        console.error('Error deleting photoes:', error);
        return { response: 299, info: 'failed' }
      }
    }
    return { response: 200, info: 'success' };
  }

  //end Hong's addition

  function haversineDistanceFeet(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 20902231; // Earth radius in feet
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function calculateDistanceToLastPoint() {
    if (!lat || !lng) {
      setCalResult("Please click a point on the map first.");
      return;
    }
    const sameTrack = location.filter((loc) => loc.track === track);
    if (sameTrack.length === 0) {
      setCalResult(`Track ${track} — dist to last point: 0.0 ft / 0.000 mi`);
      setLength(0);
      return;
    }
    const sorted = [...sameTrack].sort((a, b) => {
      const aStr = `${a.date ?? ""}T${a.time ?? "00:00:00"}`;
      const bStr = `${b.date ?? ""}T${b.time ?? "00:00:00"}`;
      return aStr.localeCompare(bStr);
    });
    const last = sorted[sorted.length - 1];
    if (last.lat == null || last.lng == null) {
      setCalResult("Last point in this track has no coordinates.");
      return;
    }
    const distFt = haversineDistanceFeet(lat, lng, last.lat, last.lng);
    setLength(distFt);
    setCalResult(
      `Track ${track} — dist to last point (${last.date} ${last.time ?? ""}): ${distFt.toFixed(1)} ft / ${(distFt / 5280).toFixed(3)} mi`
    );
  }

  const onClick = useCallback((e: MapMouseEvent) => {
    const feature = e.features?.[0];

    //console.log("clicked feature =", feature);
    if (!feature || feature.geometry.type !== 'Point') {
      //console.log(e);
      setLat(e.lngLat.lat);
      setLng(e.lngLat.lng);
      setPopupInfo(null);
    }
    else {

      const [lng, lat] = feature.geometry.coordinates;
      setPopupInfo({
        longitude: lng,
        latitude: lat,
        properties: feature.properties as WaterFeatureProperties,
      })
    };
  }, []);

  const onMouseEnter = useCallback(() => setCursor('pointer'), []);
  const onMouseLeave = useCallback(() => setCursor('grab'), []);

  const change_basemap = (value: string) => {
    if (value === "light") {
      setBasemap("mapbox://styles/mapbox/light-v11")
    } else if (value === "street") {
      setBasemap("mapbox://styles/mapbox/streets-v12")
    } else if (value === "satellite") {
      setBasemap("mapbox://styles/hazensawyer/clf4dasal001301qvxatwv8md")
    }
  };

  return (
    <main>
      <h1>Washington Park Project</h1>
      <Divider orientation="horizontal" />
      <br />
      <Flex>
        <Button onClick={signOut} width={120}>
          Sign out
        </Button>
        <Button onClick={createLocation} backgroundColor={"azure"} color={"red"}>
          + new
        </Button>
        <Button onClick={calculateDistanceToLastPoint} backgroundColor={"lightyellow"} color={"darkgreen"}>
          Cal
        </Button>
        {calResult && (
          <span className="cal-result">{calResult}</span>
        )}
      </Flex>
      <br />
      <Flex direction="row">

        <input
          type="date"
          value={date}
          placeholder="date"
          onChange={handleDate}
        //width="150%"
        />
        <input
          type="time"
          value={time}
          placeholder="time"
          onChange={handleTime}
        //width="150%"
        />
        <input
          type="number"
          value={track}
          placeholder="track"
          onChange={handleTrack}
        //width="150%"
        />
        <SelectField
          label="Select an option"
          labelHidden={true}
          value={type}
          onChange={handleSelectChange}
        //width="100%"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>


        <input
          type="number"
          value={diameter}
          placeholder="diameter (in)"
          onChange={handleDiameter}
        //width="150%"
        />

        <Input
          type="text"
          value={description}
          placeholder="description"
          onChange={handleDescription}
          width="800px"
        />
        <label className="joint-label">
          <input
            type="checkbox"
            checked={joint}
            onChange={handleJoint}
          />
          Joint
        </label>
        {/* <Input type="number" value={Number(lat.toFixed(10))} />
        <Input type="number" value={Number(lng.toFixed(10))} /> */}
      </Flex>
      <Divider orientation="horizontal" />
      <br />
      <Tabs
        value={tab}
        onValueChange={(tab) => setTab(tab)}
        items={[
          {
            label: "History Map",
            value: "1",
            content: (<>
              <Map
                style={{ width: "100%", height: "1000px" }}
                initialViewState={{
                  longitude: -80.20321,
                  latitude: 26.00068,
                  zoom: 16,
                }}
                mapboxAccessToken={MAPBOX_TOKEN}
                //mapLib={maplibregl}
                mapStyle={basemap} // Use any MapLibre-compatible style

                interactiveLayerIds={['water-points']}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                cursor={cursor}
              >
                <Source id="water-data" type="geojson" data={AIR_PORTS}>

                  <Layer
                    id='water-points'
                    type='circle'
                    source='water-data'
                    paint={{
                      'circle-radius': ['case', ['==', ['get', 'joint'], false], 12, 6],
                      'circle-color': [
                        'match',
                        ['get', 'type'],
                        'water', '#2b6cb0', // Diameter of exactly 10 is red
                        "wastewater", '#2ea160', // Diameter of exactly 20 is green
                        '#eca4a4'         // Fallback color for any other value
                      ]/* '#2b6cb0' */,
                      'circle-stroke-color': '#ffffff',
                      'circle-stroke-width': 2,
                      'circle-opacity': 0.9,
                    }}
                  />
                </Source>

                <Source id="wMain" type="vector" url="mapbox://hazensawyer.5764gcxp">
                  <Layer
                    id='water-lines'
                    type='line'
                    source='wMain'
                    source-layer="wMain-1r1fzu"
                    paint={{
                      'line-width': 1,
                      // Use a get expression (https://docs.mapbox.comhttps://docs.mapbox.com/style-spec/reference/expressions/#get)
                      // to set the line-color to a feature property value.
                      'line-color': "#2b6cb0",
                      'line-dasharray': [4, 2]
                    }}
                  />
                </Source>
                <Source id="sgravity" type="vector" url="mapbox://hazensawyer.54mpxvz3">
                  <Layer
                    id='gravity-lines'
                    type='line'
                    source='sgravity'
                    source-layer="sGravity-d079ci"
                    paint={{
                      'line-width': 1,
                      // Use a get expression (https://docs.mapbox.comhttps://docs.mapbox.com/style-spec/reference/expressions/#get)
                      // to set the line-color to a feature property value.
                      'line-color': "#2ea160",
                      'line-dasharray': [4, 2]
                    }}
                  />
                </Source>
                <Source id="sdrain" type="vector" url="mapbox://hazensawyer.6439un68">
                  <Layer
                    id='storm-lines'
                    type='line'
                    source='sdrain'
                    source-layer="sDrain-7lho1y"
                    paint={{
                      'line-width': 1,
                      // Use a get expression (https://docs.mapbox.comhttps://docs.mapbox.com/style-spec/reference/expressions/#get)
                      // to set the line-color to a feature property value.
                      'line-color': "#eca4a4",
                      'line-dasharray': [4, 2]
                    }}
                  />
                </Source>
                <Marker latitude={Number(lat)} longitude={Number(lng)} />
                {popupInfo && (
                  <>
                    <Popup
                      longitude={popupInfo.longitude}
                      latitude={popupInfo.latitude}
                      anchor="bottom"
                      offset={12}
                      onClose={() => setPopupInfo(null)}
                      closeOnClick={false}
                    >
                      <div className="popup">
                        <h3 className="popup-title">
                          <span className="popup-type-badge">{popupInfo.properties.type}</span>
                          Water Infrastructure
                        </h3>
                        <table className="popup-table">
                          <tbody>
                            <tr>
                              <td>Date</td>
                              <td>{popupInfo.properties.date}</td>
                            </tr>
                            {popupInfo.properties.description && (
                              <tr>
                                <td>Description</td>
                                <td>{popupInfo.properties.description}</td>
                              </tr>
                            )}
                            <tr>
                              <td>Track</td>
                              <td>{popupInfo.properties.track}</td>
                            </tr>
                          </tbody>
                        </table>
                        <Button
                          onClick={() => {
                            //console.log("clickinfo =" + clickInfo);
                            deleteLocation(popupInfo.properties.id);
                            setPopupInfo(null);
                            //setShowPopup(false);
                          }}
                        >
                          Delete{" "}
                        </Button>
                        <br />
                        <label>Place photos:</label><br />
                        <input type="file" multiple
                          onChange={(e) => previewPhotos(e)}
                          placeholder="new picture"
                        /><br />

                        <Button
                          onClick={(e) => {
                            console.log(popupInfo.properties);
                            handleSubmit(e, popupInfo.properties.id);
                            setPopupInfo(null);
                            //setShowPopup(false);
                          }}
                        >
                          Upload
                        </Button>
                      </div>
                    </Popup>

                  </>

                )}
                <NavigationControl position="top-right" />
                <ScaleControl position="bottom-right" unit='imperial' maxWidth={500} />
                <GeolocateControl position="top-right" positionOptions={{ enableHighAccuracy: true }}
                  trackUserLocation={true}
                  // Draw an arrow next to the location dot to indicate which direction the device is heading.
                  showUserHeading={true} />
                <RadioGroupField legend="Row" name="row" direction="row" onChange={(e) => change_basemap(e.target.value)} defaultValue="street">
                  <Radio value="light" >Light</Radio>
                  <Radio value="street">Street</Radio>
                  <Radio value="satellite">Satellite</Radio>
                </RadioGroupField>
              </Map>
            </>)
          },
          {
            label: "History Data",
            value: "2",
            content: (<>
              <ScrollView
                as="div"
                ariaLabel="View example"
                backgroundColor="var(--amplify-colors-white)"
                borderRadius="6px"
                //border="1px solid var(--amplify-colors-black)"
                // boxShadow="3px 3px 5px 6px var(--amplify-colors-neutral-60)"
                color="var(--amplify-colors-blue-60)"
                // height="45rem"
                // maxWidth="100%"
                padding="1rem"
              // width="100%"
              // width="1000px"
              // height={"2400px"}
              // maxHeight={"2400px"}
              // maxWidth="1000px"

              >
                <ThemeProvider theme={theme} colorMode="light">
                  <Table caption="" highlightOnHover={false} variation="striped" className="data-table">
                    <TableHead>
                      <TableRow>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Date</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Time</TableCell>
                        <TableCell as="th" /* style={{ width: '10%' }} */>Track</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Type</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>User</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Joint</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Diameter</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Length</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Images</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Latitude</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Longitude</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...location].sort((a, b) =>
                        (a.track ?? 0) - (b.track ?? 0) ||
                        (a.date ?? "").localeCompare(b.date ?? "") ||
                        (a.time ?? "").localeCompare(b.time ?? "")
                      ).map((location) => (
                        <TableRow
                          onDoubleClick={(e) => {
                            console.log("location photos url =", location.photos)
                            console.log(e)
                            if (location.photos)
                              deleteLocation2(location.id, location.photos)
                            else
                              deleteLocation(location.id)
                          }


                          }
                          key={location.id}
                        >
                          <TableCell /* width="15%" */>{location.date}</TableCell>
                          <TableCell /* width="15%" */>{location.time}</TableCell>
                          <TableCell /* width="10%" */>{location.track}</TableCell>
                          <TableCell /* width="15%" */>{location.type}</TableCell>
                          <TableCell /* width="15%" */>{location.username}</TableCell>
                          <TableCell /* width="15%" */>{location.joint ? "Yes" : "No"}</TableCell>
                          <TableCell /* width="15%" */>{location.diameter}</TableCell>
                          <TableCell /* width="15%" */>{location.length}</TableCell>
                          <TableCell /* width="15%" */>{location.photos ? location.photos.length : 0}</TableCell>
                          <TableCell /* width="15%" */>{location.lat}</TableCell>
                          <TableCell /* width="15%" */>{location.lng}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                  </Table>
                </ThemeProvider>
              </ScrollView>
            </>)
          },
          {
            label: "Cost Tracking",
            value: "11",
            content: <div className="water-cost-tab"><WaterCostDetailTab records={location} priceMap={priceMap} /></div>
          },
        ]}
      />

    </main>
  );
}

export default App;
