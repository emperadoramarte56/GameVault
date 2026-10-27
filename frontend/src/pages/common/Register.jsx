import React from "react";
import { Button, Form } from "semantic-ui-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../../api/user";

export function Register() {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: initialValues(),
    validationSchema: validationSchema(),
    onSubmit: async (formValues) => {
      try {
        // password_confirm solo sirve para validar en el formulario; no se envía
        // eslint-disable-next-line no-unused-vars
        const { password_confirm, ...datos } = formValues;
        await registerApi(datos);
        toast.success("Cuenta creada. Ahora inicia sesión.");
        navigate("/login");
      } catch (error) {
        toast.error(error.message);
      }
    },
  });

  return (
    <div className="register-admin">
      <div className="register-admin__content">
        <h1>Registro</h1>
        <Form className="register-form-admin" onSubmit={formik.handleSubmit}>
          <label>Username</label>
          <Form.Input
            name="username"
            placeholder="Username"
            value={formik.values.username}
            onChange={(e) => {
              const value = e.target.value.replace(/\s+/g, ""); // sin espacios
              formik.setFieldValue("username", value);
            }}
            onBlur={formik.handleBlur}
            error={formik.touched.username && formik.errors.username}
          />
          <label>Gamertag (opcional)</label>
          <Form.Input
            name="gamertag"
            placeholder="Gamertag"
            value={formik.values.gamertag}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.gamertag && formik.errors.gamertag}
          />
          <label>Correo electrónico</label>
          <Form.Input
            name="email"
            placeholder="Correo electrónico"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && formik.errors.email}
          />
          <label>Contraseña</label>
          <Form.Input
            name="password"
            type="password"
            placeholder="Contraseña"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && formik.errors.password}
            autoComplete="new-password"
          />
          <label>Confirmar contraseña</label>
          <Form.Input
            name="password_confirm"
            type="password"
            placeholder="Confirmar contraseña"
            value={formik.values.password_confirm}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.password_confirm && formik.errors.password_confirm
            }
            autoComplete="new-password"
          />
          <Button
            type="submit"
            content="Crear cuenta"
            primary
            fluid
            loading={formik.isSubmitting}
          />
        </Form>
        <p className="auth-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

function initialValues() {
  return {
    username: "",
    gamertag: "",
    email: "",
    password: "",
    password_confirm: "",
  };
}

function validationSchema() {
  return Yup.object({
    username: Yup.string()
      .required("El username es obligatorio")
      .matches(/^\S*$/, "El username no debe contener espacios"),
    gamertag: Yup.string().max(30, "Máximo 30 caracteres"),
    email: Yup.string()
      .email("Correo electrónico no válido")
      .required("El correo electrónico es obligatorio"),
    password: Yup.string()
      .required("La contraseña es obligatoria")
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .matches(/[A-Z]/, "La contraseña debe contener al menos una letra mayúscula")
      .matches(/\d/, "La contraseña debe contener al menos un número")
      .matches(
        /[@$!%*?&#]/,
        "La contraseña debe contener al menos un carácter especial (@$!%*?&#)"
      ),
    password_confirm: Yup.string()
      .required("La confirmación de contraseña es obligatoria")
      .oneOf([Yup.ref("password"), null], "Las contraseñas no coinciden"),
  });
}
