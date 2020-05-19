import { Box, Button, Fab, IconButton, Snackbar, TextField, Typography } from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { makeStyles } from "@material-ui/core/styles";
import { Home as HomeIcon, Refresh as RefreshIcon } from "@material-ui/icons";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import Alert from "@material-ui/lab/Alert";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { firestore } from "../../firebase";
import { ReactComponent as ErrorIllustration } from "../../illustrations/error.svg";
import { ReactComponent as NoDataIllustration } from "../../illustrations/no-data.svg";
import EmptyState from "../EmptyState";
import ListCard from "../ListCard/ListCard";
import Loader from "../Loader";

function ListsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [lists, setLists] = useState("");
  const [openAddList, setOpenAddList] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [nameNewList, setNameNewList] = useState("");
  const [descriNewList, setDescriNewList] = useState("");
  const [messageAlert, setMessageAlert] = useState("");
  const [idAlertEdit, setIdAlertEdit] = useState("");
  const { userId } = useParams();
  const classes = useStyles();

  const realizarConsultas = async () => {
    await firestore
      .collection("users")
      .doc(userId)
      .onSnapshot(
        (snapshot) => {
          setUser(snapshot.data());
        },
        (error) => {
          setError(error);
        }
      );

    await firestore
      .collection("lists")
      .where("userId", "==", userId)
      .get()
      .then(
        (snapshot) => {
          if (snapshot.empty) {
            createDefaultList(userId);
          } else {
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
          }
        },
        (error) => {
          setError(error);
        }
      );

    setLoading(false);
  };

  useEffect(() => {
    console.log("entre a useEffect lists page");

    realizarConsultas();
  }, [userId]);

  const createDefaultList = (userId) => {
    console.log("createDefaultList", userId);
    firestore
      .collection("lists")
      .add({
        listName: "Favoritas",
        userId: userId,
        description: "Estas son mis pelis favoritas",
      })
      .then(function (doc) {
        let listas = [
          {
            id: doc.id,
            listName: "Favoritas",
            description: "Estas son mis pelis favoritas",
          },
        ];
        setLists(listas);
      })
      .catch(function (error) {
        console.log("error", error);
        setError(error);
      });
  };

  if (error) {
    return (
      <EmptyState
        image={<ErrorIllustration />}
        title="No se pudo obtener el usuario"
        description="Ocurrio un problema tratando de obtener tu información"
        button={
          <Fab
            variant="extended"
            color="primary"
            onClick={() => window.location.reload()}
          >
            <Box clone mr={1}>
              <RefreshIcon />
            </Box>
            Reintentar
          </Fab>
        }
      />
    );
  }

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return (
      <EmptyState
        image={<NoDataIllustration />}
        title="El usuario no existe"
        description="La solicitud de usuario no existe"
        button={
          <Fab variant="extended" color="primary" component={Link} to="/">
            <Box clone mr={1}>
              <HomeIcon />
            </Box>
            Inicio
          </Fab>
        }
      />
    );
  }

  const _handleAddList = () => {
    setOpenAddList(true);
  };

  const handleClose = () => {
    setOpenAddList(false);
  };

  const handleSaveList = () => {
    setLoading(true);
    // Validar si se esta creando o editando una lista
    if (idAlertEdit) {
      console.log('idAlertEdit', idAlertEdit)
      firestore
        .collection("lists")
        .doc(idAlertEdit)
        .set({
          listName: nameNewList,
          description: descriNewList,
          userId: userId
        })
        .then(function () {
          setMessageAlert("Lista editada !");
          setOpenSnackbar(true);
          setOpenAddList(false);
          realizarConsultas();

        })
        .catch(function (error) {
          setError(error);
          setOpenAddList(false);
          setLoading(false);
        });
    } else {
      firestore
        .collection("lists")
        .add({
          listName: nameNewList,
          userId: userId,
          description: descriNewList,
        })
        .then(function () {
          setMessageAlert("Lista agregada !");
          setOpenSnackbar(true);
          setOpenAddList(false);
          realizarConsultas();

        })
        .catch(function (error) {
          setError(error);
          setOpenAddList(false);
          setLoading(false);
        });
    }
  };

  const handleCloseSnack = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpenSnackbar(false);
  };

  const editList = (list) => {
    console.log("Editando la lista", list);
    setNameNewList(list.listName);
    setDescriNewList(list.description);
    setOpenAddList(true);
    setIdAlertEdit(list.id);
  };

  const deleteList = async (idList) => {
    console.log("deleteList la lista", idList);
    setLoading(true);
    await firestore
      .collection("ListMovies")
      .where("listId", "==", idList)
      .get()
      .then(
        (snapshot) => {
          let batch = firestore.batch();
          snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });

          return batch.commit().then(() => {
            console.log("snapshot.size", snapshot.size);
            return snapshot.size;
          });
        },
        (error) => {
          setError(error);
          setLoading(false);
        }
      );

    // Eliminar la lista
    await firestore
      .collection("lists")
      .doc(idList)
      .delete()
      .then(function () {
        console.log("Lista eliminada");
        setMessageAlert("Lista eliminada!");
        realizarConsultas();
        setOpenSnackbar(true);
      })
      .catch(function (error) {
        setError(error);
        setLoading(false);
      });
  };

  return (
    <Box mt={9} width="100%">
      <Typography
        align="center"
        className={classes.tituloList}
        color="textPrimary"
        variant="h4"
      >
        Mis listas
      </Typography>

      <IconButton color="inherit" onClick={_handleAddList}>
        <AddCircleIcon fontSize="large" />
      </IconButton>

      <Box
        display="flex"
        justifyContent="space-around"
        flexWrap="wrap"
        p={1}
        width="100%"
      >
        {lists !== "" &&
          lists.map((l) => (
            <ListCard
              editList={editList}
              deleteList={deleteList}
              key={l.id}
              list={l}
            />
          ))}
      </Box>

      <Dialog
        aria-labelledby="form-dialog-title"
        maxWidth="xs"
        onClose={handleClose}
        open={openAddList}
      >
        <DialogTitle>Datos de la lista</DialogTitle>
        <DialogContent>
          <DialogContentText>Ingresar los datos de tu lista.</DialogContentText>
          <TextField
            fullWidth
            id="name"
            label="Nombre"
            margin="dense"
            type="text"
            onChange={(e) => setNameNewList(e.target.value)}
            value={nameNewList}
          />
          <TextField
            fullWidth
            id="description"
            label="Descripción"
            margin="dense"
            type="text"
            onChange={(e) => setDescriNewList(e.target.value)}
            value={descriNewList}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleSaveList} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        autoHideDuration={6000}
        onClose={handleCloseSnack}
        open={openSnackbar}
      >
        <Alert onClose={handleCloseSnack} severity="success">
          {messageAlert}{" "}
          <span aria-label="emogi" role="img">
            🤘
          </span>
        </Alert>
      </Snackbar>
    </Box>
  );
}

const useStyles = makeStyles((theme) => ({
  tituloList: {
    marginTop: theme.spacing(1),
    paddingLeft: theme.spacing(6),
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },
}));

export default ListsPage;