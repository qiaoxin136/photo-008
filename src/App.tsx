import type { ChangeEvent, SyntheticEvent } from "react";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { Schema } from "../amplify/data/resource";
import { checkLoginAndGetName } from "./utils/AuthUtils";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from "aws-amplify/data";
import "@aws-amplify/ui-react/styles.css";
import { uploadData, remove } from "aws-amplify/storage";
import { StorageImage } from "@aws-amplify/ui-react-storage"; //Hong

import type { MapMouseEvent } from "mapbox-gl";


import 'mapbox-gl/dist/mapbox-gl.css';
//import { useGeoJSON } from './useGeoJSON';

import type { WaterFeatureProperties } from './types';
import './MapView.css';

//import { MapboxOverlay, MapboxOverlayProps } from "@deck.gl/mapbox/typed";
//import { PickingInfo } from "@deck.gl/core/typed";

import "@aws-amplify/ui-react/styles.css";

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



import "mapbox-gl/dist/mapbox-gl.css";


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

import "@aws-amplify/ui-react/styles.css";

import "@aws-amplify/ui-react/styles.css";

//import { IconLayer } from "@deck.gl/layers/typed";


//import type { WaterFeatureProperties } from './types';
import './FeaturePopup.css';

const MAPBOX_TOKEN = "pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmMnY0NzE1MGMzMjNycGp6bDQwcWZsNyJ9.1JJeWIQgrykU5b3oqSr1sQ";
const client = generateClient<Schema>();

type ByCategory = Record<string, { count: number; sum: number }>;


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
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [placePhotos, setPlacePhotos] = useState<File[]>([]);

  const [tab, setTab] = useState("1");
  const [basemap, setBasemap] = useState("mapbox://styles/mapbox/streets-v12");

  //const [clickInfo, setClickInfo] = useState<DataT>();
  //const [showPopup, setShowPopup] = useState<boolean>(true);


  const { totalSum, totalCount, byCategory } = useExpenseAggregates();

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

  useEffect(() => {

    client.models.Location.observeQuery().subscribe({
      next: (data) => setLocation([...data.items]),
    });
  }, []);

  useEffect(() => {
    handleUserName();
  }, []);



  function createLocation() {
    handleUserName();
    //console.log(typeof userName);
    //console.log("Username:", userName);
    const name = userName
    //console.log(name);
    client.models.Location.create({
      date: date,
      time: time,
      track: track,
      type: type,
      diameter: diameter,
      length: length,
      username: name,
      description: description,


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

    photourls.forEach(
      async (aPath) => {
        if (aPath)
          try {
            await remove({ path: aPath })
          } catch (error) {
            console.error('Error deleting photoes:', error);
            return { response: 299, info: 'failed' }
          }
      }
    )


    client.models.Location.delete({ id })

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
    //console.log(id);
    //console.log(userName);

    if (userName) {
      let placePhotosUrls: string[] = [];
      console.log("before submit, photoes size ", placePhotos.length);
      const uploadResult = await uploadPhotos(placePhotos, id)   //Hong
      placePhotosUrls = uploadResult.urls;

      const currentLoc = await client.models.Location.get({
        id: id
      })

      let revised: string[] = []
      if (currentLoc.data?.photos) {
        currentLoc.data.photos.forEach(
          (d) => {
            d ? revised.push(d) : null
          }
        )
      }

      await client.models.Location.update({
        id: id,
        photos: [...placePhotosUrls, ...revised]

      })


      clearFields();
    }
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
  function previewPhotos(event: CustomEvent) {

    if (event.target.files) {
      const eventPhotos = Array.from(event.target.files);
      //const newFiles: File[] = [...new Set([...eventPhotos, ...placePhotos])]
      //console.log("newFiles =", newFiles)
      //setPlacePhotos(newFiles);
      setPlacePhotos(eventPhotos)
    }
  }

  function renderPhotos() {

    const rows: any[] = []

    if (location) {

      location.forEach((loc, index) => {
        if (loc.photos) {

          rows.push(
            <h4>Date: {loc.date}  &nbsp; &nbsp;&nbsp; Description: {loc.description}
              &nbsp; &nbsp; &nbsp;</h4>)
          loc.photos.forEach((photo, idx) => {
            if (photo) {
              rows.push(<StorageImage path={photo}
                alt={photo} key={index * 1000 + idx} height={300}
                style={{ marginLeft: '10px' }} />)
            }
          })

        }
      })
    }
    return rows;
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

  function useExpenseAggregates() {
    const [items, setItems] = useState<Array<Schema["Location"]["type"]>>([]);

    useEffect(() => {
      // Realtime query (updates when data changes)
      const sub = client.models.Location.observeQuery({
        // optional: add filter to limit what you pull down
        // filter: { createdAt: { ge: "2025-12-01T00:00:00.000Z" } },
      }).subscribe({
        next: ({ items }) => setItems(items),
        error: (err) => console.error(err),
      });

      return () => sub.unsubscribe();
    }, []);

    const aggregates = useMemo(() => {
      const byCategory: ByCategory = {};
      let totalSum = 0;

      for (const e of items) {
        const cat = e.track ?? 0;
        const amt = Number(e.length ?? 0);

        totalSum += amt;

        if (!byCategory[cat]) byCategory[cat] = { count: 0, sum: 0 };
        byCategory[cat].count += 1;
        byCategory[cat].sum += amt;
      }

      return { totalSum, byCategory, totalCount: items.length };
    }, [items]);

    return aggregates;
  }

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
          <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "#333", marginLeft: "8px" }}>
            {calResult}
          </span>
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
                initialViewState={{
                  longitude: -80.20321,
                  latitude: 26.00068,
                  zoom: 16,
                }}
                mapboxAccessToken={MAPBOX_TOKEN}
                //mapLib={maplibregl}
                mapStyle={basemap} // Use any MapLibre-compatible style

                style={{
                  width: "100%",
                  height: "1000px",
                  borderColor: "#000000",
                }}
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
                      'circle-radius': 6,
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
                  <Table caption="" highlightOnHover={false} variation="striped"
                    style={{
                      //tableLayout: 'fixed',
                      width: '100%',
                      fontFamily: 'Arial, sans-serif',
                    }}>
                    <TableHead>
                      <TableRow>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Date</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Time</TableCell>
                        <TableCell as="th" /* style={{ width: '10%' }} */>Track</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Type</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>User</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Diameter</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Length</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Images</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Latitude</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Longitude</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {location.map((location) => (
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
            label: "Statistics",
            value: "3",
            content: (<>
              <div>
                <h2>Total Length (ft): {totalSum.toFixed(0)} ({totalCount} items)</h2>

                <ul>
                  {Object.entries(byCategory).map(([cat, v]) => (
                    <li key={cat}>
                      {cat}: {v.sum.toFixed(0)} feet ({v.count} counts)
                    </li>
                  ))}
                </ul>
              </div>
            </>)
          },
          {
            label: "Photos",
            value: "4",
            content: (<>
              <h3>Photos and Comments</h3>
              {renderPhotos()}
            </>)
          },
        ]}
      />

    </main>
  );
}

export default App;
