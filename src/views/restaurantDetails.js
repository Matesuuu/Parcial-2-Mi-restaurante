import React, { useState, useEffect } from "react";
import Nav from "../components/Nav.js";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Footer from "../components/footer.js";

const DetalleRestaurante = () => {
  const { id } = useParams();
  const [restaurante, setRestaurante] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [fechaReserva, setFechaReserva] = useState("");
  const [horaReserva, setHoraReserva] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const yourAuthToken = localStorage.getItem("token");

  const handleReservaSubmit = async (e) => {
    e.preventDefault();

    if (!yourAuthToken) {
      setShowLoginModal(true);
      return;
    }

    await obtenerReservas();

    const formattedFechaReserva = new Date(`${fechaReserva}T${horaReserva}`);
    const formattedHoraReserva = formattedFechaReserva
      .toISOString()
      .split("T")[1]
      .substring(0, 5);

    console.log("Fecha y hora de reserva:", fechaReserva, horaReserva);
    console.log("Reservas existentes:", reservas);
    console.log("Datos de la nueva reserva:", {
      fecha: formattedFechaReserva.toISOString(),
      hora: formattedHoraReserva,
      restaurante: id,
      usuario: yourUserId,
    });

    const fechaHoraReservaOcupada = reservas.some((reserva) => {
      const reservaFecha = new Date(reserva.fecha + "T" + reserva.hora);
      return reservaFecha.getTime() === formattedFechaReserva.getTime();
    });

    if (fechaHoraReservaOcupada) {
      setError("La fecha y hora seleccionadas ya están ocupadas");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/reservas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${yourAuthToken}`,
        },
        body: JSON.stringify({
          restauranteId: id,
          usuarioId: yourUserId,
          fecha: formattedFechaReserva.toISOString().split("T")[0],
          hora: formattedHoraReserva,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        obtenerRestaurantePorId();
      } else {
        setError("Error al agregar la reserva");
      }
    } catch (error) {
      console.error("Error al realizar la solicitud:", error);
      setError("Error en el servidor");
    }
  };

  const obtenerUsuarioIdDesdeToken = () => {
    try {
      const decodedToken = jwtDecode(yourAuthToken);
      return decodedToken._id;
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return null;
    }
  };

  const obtenerReservas = async () => {
    try {
      const reservasResponse = await fetch(
        `http://localhost:3000/api/reservas`
      );
      const reservasData = await reservasResponse.json();
      setReservas(reservasData);
    } catch (error) {
      console.error("Error al obtener la lista de reservas:", error);
    }
  };

  const yourUserId = obtenerUsuarioIdDesdeToken();

  const obtenerRestaurantePorId = async () => {
    const endpoint = `http://localhost:3000/api/restaurantes/${id}`;

    try {
      const reservasResponse = await fetch(
        `http://localhost:3000/api/reservas`
      );
      const reservasData = await reservasResponse.json();
      setReservas(reservasData);

      const response = await fetch(endpoint);
      const data = await response.json();

      if (response.ok) {
        setRestaurante(data);

        const reviewsData = await Promise.all(
          data.reviews.map(async (reviewId) => {
            const reviewEndpoint = `http://localhost:3000/api/resenas/${reviewId}`;
            const reviewResponse = await fetch(reviewEndpoint);
            return reviewResponse.json();
          })
        );

        const reservasData = await Promise.all(
          data.reservas.map(async (reservaId) => {
            const reservaEndpoint = `http://localhost:3000/api/reservas/${reservaId}`;
            const reservaResponse = await fetch(reservaEndpoint);
            return reservaResponse.json();
          })
        );

        setReservas(reservasData);
        setReviews(reviewsData);
      } else {
        setError("Error al obtener la información del restaurante");
      }
    } catch (error) {
      console.error("Error al realizar la solicitud:", error);
      setError("Error en el servidor");
    }
  };

  useEffect(() => {
    obtenerRestaurantePorId();
  }, [id, yourAuthToken]);
  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!yourAuthToken) {
      setShowLoginModal(true);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/resenas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${yourAuthToken}`,
        },
        body: JSON.stringify({
          userId: yourUserId,
          restaurantId: id,
          rating,
          comment,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        obtenerRestaurantePorId();
      } else {
        setError("Error al agregar la revisión");
      }
    } catch (error) {
      console.error("Error al realizar la solicitud:", error);
      setError("Error en el servidor");
    }
  };

  return (
    <div>
      <Nav></Nav>
      <div className="container mt-4">
        {error && <div className="alert alert-danger">{error}</div>}

        {restaurante && (
          <div>
            <h1>{restaurante.nombre}</h1>

            <p>Direccion: {restaurante.ubicacion}</p>
            <p>Horarios: {restaurante.horarios}</p>
            <h6 className="card-subtitle mb-2 text-muted">Menú:</h6>
            <ul className="list-group">
              {restaurante.menu.map((plato) => (
                <li key={plato._id} className="list-group-item">
                  <strong>{plato.nombre}</strong>
                  <p>{plato.descripcion}</p>
                  <p>Precio: ${plato.precio.toFixed(2)}</p>
                </li>
              ))}
            </ul>
            <div className="row mt-4">
              <div className="col">
                <h6 className="card-subtitle mb-2 text-muted">Reservas:</h6>
                <ul className="list-group">
                  {reservas.map((reserva) => (
                    <li key={reserva._id} className="list-group-item">
                      <p>
                        Fecha: {new Date(reserva.fecha).toLocaleDateString()}
                      </p>
                      <p>Hora: {reserva.hora}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col">
                <h6 className="card-subtitle mb-2 text-muted">Reseñas:</h6>
                <ul className="list-group">
                  {reviews.map((review) => (
                    <li key={review._id} className="list-group-item">
                      <p>Calificación: {review.rating}⭐</p>
                      <p>{review.comment}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="row mt-4">
              <div className="col">
                <form onSubmit={handleReservaSubmit} className="mt-3">
                  <div className="mb-3">
                    <label htmlFor="fechaReserva" className="form-label">
                      Fecha de Reserva:
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="fechaReserva"
                      value={fechaReserva}
                      onChange={(e) => setFechaReserva(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="horaReserva" className="form-label">
                      Hora de Reserva:
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      id="horaReserva"
                      value={horaReserva}
                      onChange={(e) => setHoraReserva(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn">
                    Agregar Reserva
                  </button>
                </form>
              </div>
              <div className="col">
                {" "}
                <form onSubmit={handleReviewSubmit} className="mt-3">
                  <div className="mb-3">
                    <label htmlFor="rating" className="form-label">
                      Calificación:
                    </label>
                    <select
                      className="form-control"
                      id="rating"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      required
                    >
                      {[5, 4, 3, 2, 1].map((option) => (
                        <option key={option} value={option}>
                          {option}⭐
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="comment" className="form-label">
                      Comentario:
                    </label>
                    <textarea
                      className="form-control"
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn ">
                    Agregar Reseña
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      {showLoginModal && (
        <div
          className="modal"
          tabIndex="-1"
          role="dialog"
          style={{ display: "block" }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header"></div>
              <div className="modal-body">
                <p>Debes iniciar sesión para hacer esta accion</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn "
                  data-dismiss="modal"
                  onClick={() => setShowLoginModal(false)}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn "
                  onClick={() => handleLogin()}
                >
                  Ir al inicio de sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer></Footer>
    </div>
  );
};

export default DetalleRestaurante;
