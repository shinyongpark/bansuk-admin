import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CLink,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'


const Register = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault()
    //check userinput or backend??
    // console.log(sessionStorage, (sessionStorage.getItem('authUser')), typeof sessionStorage.getItem('authUser'))
    // console.log("registerjs userInfo:", userInfo)
    if (Object.keys(userInfo).length != 4) {
      alert('필드를 모두 입력해주세요');
      return;
    } else if (userInfo.password != userInfo.repeatPassword) {
      alert('패드워드가 동일하지 않습니다');
      return;
    } else if (sessionStorage.getItem('authUser') !== "true") {
      alert('해당 계정은 회원을 등록할 수 없습니다')
      return;
    }


    //post userinfo
    try {
      const response = await axios.post('/register/userInfo', userInfo, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });
      alert(`${userInfo.name}이/가 등록되었습니다`);
      navigate('/');
    } catch (error) {
      if (error?.response?.data?.error?.code === 11000) {
        alert('아이디(Username)가 중복됐습니다');
      } else {
        console.error('Error registration:', error);
        alert('회원가입에 실패했습니다. 관리자에게 문의하여주세요');
      }
      return;
    }
  };



  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={9} lg={7} xl={6}>
            <CCard className="mx-4">
              <CCardBody className="p-4">
                <CLink
                  href="/"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '20px',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    color: '#007bff'
                  }}
                >
                  Home
                </CLink>
                <CForm>
                  <h1>Register</h1>
                  <p className="text-body-secondary">Create your account</p>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput placeholder="Name" autoComplete="name" name="name" onChange={handleChange} />
                  </CInputGroup>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput placeholder="Username" autoComplete="username" name="username" onChange={handleChange} />
                  </CInputGroup>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Password"
                      autoComplete="new-password"
                      name="password"
                      onChange={handleChange}
                    />
                  </CInputGroup>
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      name="repeatPassword"
                      onChange={handleChange}
                    />
                  </CInputGroup>
                  <div className="d-grid">
                    <CButton color="success" onClick={handleRegister}>
                      Create Account
                    </CButton>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Register
