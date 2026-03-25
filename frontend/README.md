# LanaTrix - Gestor Financiero Personal

LanaTrix es una aplicación web Full-Stack diseñada para ayudar a los usuarios a tomar el control de sus finanzas personales. Permite registrar ingresos y gastos, crear categorías personalizadas, visualizar estadísticas en un dashboard interactivo.

Características Principales

* **Autenticación Segura:** Registro e inicio de sesión de usuarios (JWT y contraseñas encriptadas).
* **Dashboard Interactivo:** Gráficas visuales (pastel, barras) para analizar la salud financiera.
* **Gestión de Movimientos:** Registro detallado de ingresos y gastos con fecha, monto y descripción.
* **Categorías Personalizadas:** Organización de transacciones por rubros (ej. Comida, Transporte, Ocio).
* **Metas de Ahorro:** Creación y seguimiento del progreso de objetivos financieros (ej. "Comprar un auto").
* **Modo Oscuro:** Interfaz moderna y amigable con la vista (Dark Theme).


## Tecnologías Utilizadas

El proyecto está dividido en dos partes principales y utiliza una arquitectura en capas (rutas, controladores, servicios).

**Frontend (Interfaz de Usuario)**
* [React] + [Vite]
* Tailwind CSS (Estilos y diseño responsivo)
* Recharts (Gráficas interactivas)
* Lucide React (Íconos)
* Axios (Peticiones HTTP)

**Backend (Servidor y Base de Datos)**
* [Node.js]+ [Express]
* [Supabase](Base de datos PostgreSQL)
* JSON Web Tokens (JWT) para sesiones
* Bcrypt (Encriptación de contraseñas)
