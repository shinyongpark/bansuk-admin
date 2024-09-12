import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isAuthenticated = () => {
    return true //change this later
    // const token = sessionStorage.getItem('authToken');
    // const expiry = sessionStorage.getItem('tokenExpiry');
    // console.log("app.js", token, expiry)

    // if (token && expiry && Date.now() < expiry) {
    //   console.log("is authenticated");
    //   return true;
    // } else {
    //   console.log("is not authenticated");
    //   sessionStorage.removeItem('authToken');
    //   sessionStorage.removeItem('tokenExpiry');
    //   return false;
    // }
  }

  return (
    <HashRouter>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={!isAuthenticated() ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated() ? <Register /> : <Navigate to="/" />} />
          <Route path="/404" element={<Page404 />} />
          <Route path="/500" element={<Page500 />} />
          <Route path="*" element={isAuthenticated() ? <DefaultLayout /> : <Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}


export default App
