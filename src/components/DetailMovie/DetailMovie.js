import {
  Avatar,
  Box,
  MenuItem,
  Select,
  Typography,
  InputLabel,
  FormControl,
  FormHelperText,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { AvatarGroup } from "@material-ui/lab";
import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import IMG_NULL from "../../assets/noImg.png";
import apiMovies from "../../services/apiMovies";
import { firestore } from "../../firebase";
import Loader from "../Loader";

const IMG_URL = "https://image.tmdb.org/t/p/w185"; //Solo renderizar si cambian las peliculas
const PROFIL_IMG_URL = "https://image.tmdb.org/t/p/w45";
const URL_YOUTUBE = "https://www.youtube.com/watch?v=";

export default function DetailMovie({ movieId, user }) {
  const [infoMovie, setInfoMovie] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [actores, setActores] = useState([]);
  const [lenguages, setLenguages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [lists, setLists] = useState([]);
  const [listSelected, setListSelected] = useState("");
  const [helperText, sethelperText] = useState("");
  const [selectError, setSelectError] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const {
    title,
    poster_path,
    vote_average,
    runtime,
    release_date,
    overview,
  } = infoMovie;

  useEffect(() => {
    console.log("entre a useEffect de detailMovie");
    const realizarConsultas = async () => {
      const infoMovie = await apiMovies.getMovie(movieId);
      setInfoMovie(infoMovie);
      setGeneros(infoMovie.genres);
      setLenguages(infoMovie.spoken_languages);

      const cast = await apiMovies.getMainCast(movieId);
      const actors = cast.cast.map((actor) => {
        let aObj = {};
        aObj["cast_id"] = actor.cast_id;
        aObj["profile_path"] =
          actor.profile_path == null || actor.profile_path === undefined
            ? IMG_NULL
            : PROFIL_IMG_URL + actor.profile_path;
        aObj["name"] = actor.name;
        return aObj;
      });
      setActores(actors);

      const videosAPI = await apiMovies.getTrailer(movieId);
      setVideos(videosAPI);

    };
    realizarConsultas();
  }, [movieId, poster_path,user]);

  const handleChangeList = (event) => {
    setSelectError(false);
    setLoadingList(true);
    const idList = event.target.value;
    setListSelected(idList);

    //Validar que la peli no exista ya en la lista seleccionada
    firestore
      .collection("ListMovies")
      .where("listId", "==", idList)
      .where("movieId", "==", movieId)
      .get()
      .then(function (querySnapshot) {
        if (querySnapshot.empty) {
          addMovieToList(idList, movieId);
        } else {
          setSelectError(true);
          sethelperText("Ya esta en esta lista");
          setLoadingList(false);
        }
      });
  };

  const handleOpenLists = () => {
      //Consultar las listas del usuario
      setLoadingList(true)

      firestore
      .collection("lists")
      .where("userId", "==", user.uid)
      .get()
      .then(
         (snapshot)  => {
          
          if (snapshot.empty) {

            createDefaultList(user.uid)

          }else{
          let listas = [];
           snapshot.forEach((doc) => {
            let lista = {
              id: doc.id,
              listName: doc.data().listName,
              description: doc.data().description,
            };
            listas.push(lista);
           
          });

          setLists(listas);
          setLoadingList(false);
        }

        },
        (error) => {
          console.error(error);
        }
      );
  }

  const createDefaultList = (userId) => {
    console.log('createDefaultList', userId)
    firestore
      .collection("lists")
      .add({
        listName: 'Favoritas',
        userId: userId,
        description: 'Estas son mis pelis favoritas'
      })
      .then(function (doc) {
        let listas = [{
          id: doc.id,
          listName: 'Favoritas',
          description: 'Estas son mis pelis favoritas'
        }]
        setLists(listas);
        setLoadingList(false);

      })
      .catch(function (error) {
        setSelectError(true);
        sethelperText(error);
        setLoadingList(false);

      });
  }

  const addMovieToList = (idList, movieId) => {
    firestore
      .collection("ListMovies")
      .add({
        listId: idList,
        movieId: movieId,
      })
      .then(function () {
        sethelperText("Agregada 👍");
        setLoadingList(false);
      })
      .catch(function (error) {
        setSelectError(true);
        sethelperText(error);
        setLoadingList(false);
      });
  };

  const classes = useStyles();

  return (
    <>
      <Box
        display="flex"
        m={1}
        justifyContent="center"
        bgcolor="background.paper"
      >
        <Box bgcolor="grey.100">
          {poster_path === undefined || poster_path == null ? (
            <img src={IMG_NULL} alt={title} className={classes.poster} />
          ) : (
            <img src={IMG_URL + poster_path} alt={title} />
          )}

          {user ? (
            <FormControl
              className={classes.agregarALista}
              error={selectError}
              variant="outlined"
            >
              <InputLabel id="labelSelect">Agregar a ...</InputLabel>
              <Select
                id="demo-simple-select-outlined"
                label="Agregar a ..."
                labelId="labelSelect"
                onChange={handleChangeList}
                onOpen={handleOpenLists}
                value={listSelected}
              >
                {lists.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.listName}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{helperText}</FormHelperText>
              {loadingList && <Loader />}
            </FormControl>
          ) : (
            "Registrate para crear tus listas"
          )}
        </Box>

        <Box
          textAlign="left"
          p={1}
          color="white"
          bgcolor="primary.dark"
          width="100%"
        >
          <Box m={1}>
            <Typography variant="h4" color="textPrimary">
              {title}
            </Typography>
            {/* <Typography variant="caption" color="initial">{original_title}</Typography> */}
          </Box>

          <Box m={1}>
            <span>{vote_average}</span> | <span>{runtime}</span> |{" "}
            <span>{release_date}</span> |
            {lenguages.map((l) => (
              <span key={l.iso_639_1}> {l.iso_639_1}</span>
            ))}
          </Box>

          <Box m={1}>
            <Typography variant="subtitle1" color="textPrimary">
              Generos:
            </Typography>
            <Typography variant="body2" color="initial">
              {generos.map((g) => (
                <span key={g.id}> {g.name} </span>
              ))}
            </Typography>
          </Box>

          <Box m={1}>
            <Typography variant="subtitle1" color="textPrimary">
              Resumen:
            </Typography>
            <Typography variant="body2" component="p" color="initial">
              {overview}
            </Typography>
          </Box>

          <Box m={1}>
            <Typography variant="subtitle1" color="textPrimary">
              Actores:
            </Typography>
            <AvatarGroup className={classes.avatarGroup} max={10}>
              {actores.map((face) => (
                <Avatar
                  key={face.cast_id}
                  alt={face.name}
                  src={face.profile_path}
                  className={classes.avatar}
                />
              ))}
            </AvatarGroup>
          </Box>
        </Box>
      </Box>

      {videos.length !== 0 && (
        <Box m={1}>
          <Typography className={classes.titleVideos} paragraph variant="h5">
            Videos
          </Typography>
          {videos.map((v) => (
            <ReactPlayer
              width="100%"
              className={classes.reproductor}
              key={v.key}
              url={URL_YOUTUBE + v.key}
            />
          ))}
        </Box>
      )}
    </>
  );
}

const useStyles = makeStyles((theme) => ({
  agregarALista: {
    width: "80%",
  },
  avatar: {
    height: theme.spacing(5),
    width: theme.spacing(5),
  },
  avatarGroup: {
    paddingLeft: "10px",
  },
  poster: {
    heigth: "264px",
    width: "185px",
  },
  reproductor: {
    display: "inline-flex",
  },
  titleVideos: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
}));
