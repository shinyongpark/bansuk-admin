import React, { useState } from 'react';
import {
    CButton,
    CCard,
    CCardBody,
    CLink,
    CCol,
    CContainer,
    CForm,
    CFormInput,
    CInputGroup,
    CInputGroupText,
    CRow
} from '@coreui/react';
import { useNavigate } from 'react-router-dom'
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilLockUnlocked } from '@coreui/icons';
import axios from 'axios';

const Profile = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(
        {
            currentPassword: false,
            newPassword: false,
            confirmNewPassword: false
        }
    );
    const [passwordInfo, setPasswordInfo] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswordInfo((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (!passwordInfo.newPassword || !passwordInfo.currentPassword || !passwordInfo.confirmNewPassword) {
            alert('필드를 모두 입력해주세요');
            return;
        } else if (passwordInfo.newPassword !== passwordInfo.confirmNewPassword) {
            alert('패드워드가 동일하지 않습니다. 새 비밀번호를 재입력해주세요');
            return;
        }

        try {
            const response = await axios.post('/profile/changePassword', {
                currentPassword: passwordInfo.currentPassword,
                newPassword: passwordInfo.newPassword
            }, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });

            alert(`새비밀번호가 등록됐습니다`);
            navigate('/');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                alert('기존의 비밀번호가 일치하지 않습니다');
            } else {
                console.error('Error changing password:', error);
                alert('문제가 발생했습니다. 관리자에게 문의해주세요');
            }
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
                                    <h1>Profile</h1>
                                    <p className="text-body-secondary">비밀번호 변경하기</p>
                                    <CInputGroup className="mb-3">
                                        {/* <CInputGroupText>
                                            <CIcon icon={cilLockLocked} />
                                        </CInputGroupText> */}
                                        <CFormInput
                                            type={showPassword.currentPassword ? 'text' : 'password'}
                                            placeholder="Current Password"
                                            autoComplete="off"
                                            name="currentPassword"
                                            onChange={handleChange}
                                            value={passwordInfo.currentPassword}
                                        />
                                        <CInputGroupText onClick={() => togglePasswordVisibility('currentPassword')} style={{ cursor: 'pointer' }}>
                                            <CIcon icon={showPassword.currentPassword ? cilLockUnlocked : cilLockLocked} />
                                        </CInputGroupText>
                                    </CInputGroup>

                                    {/* New Password Input */}
                                    <CInputGroup className="mb-3">
                                        {/* <CInputGroupText>
                                            <CIcon icon={cilLockLocked} />
                                        </CInputGroupText> */}
                                        <CFormInput
                                            type={showPassword.newPassword ? 'text' : 'password'}
                                            placeholder="New Password"
                                            autoComplete="off"
                                            name="newPassword"
                                            onChange={handleChange}
                                            value={passwordInfo.newPassword}
                                        />
                                        <CInputGroupText onClick={() => togglePasswordVisibility('newPassword')} style={{ cursor: 'pointer' }}>
                                            <CIcon icon={showPassword.newPassword ? cilLockUnlocked : cilLockLocked} />
                                        </CInputGroupText>
                                    </CInputGroup>

                                    {/* Confirm New Password Input */}
                                    <CInputGroup className="mb-4">
                                        {/* <CInputGroupText>
                                            <CIcon icon={cilLockLocked} />
                                        </CInputGroupText> */}
                                        <CFormInput
                                            type={showPassword.confirmNewPassword ? 'text' : 'password'}
                                            placeholder="Confirm New Password"
                                            autoComplete="off"
                                            name="confirmNewPassword"
                                            onChange={handleChange}
                                            value={passwordInfo.confirmNewPassword}
                                        />
                                        <CInputGroupText onClick={() => togglePasswordVisibility('confirmNewPassword')} style={{ cursor: 'pointer' }}>
                                            <CIcon icon={showPassword.confirmNewPassword ? cilLockUnlocked : cilLockLocked} />
                                        </CInputGroupText>
                                    </CInputGroup>
                                    <div className="d-grid">
                                        <CButton color="success" onClick={handlePasswordChange}>
                                            변경하기
                                        </CButton>
                                    </div>
                                </CForm>
                            </CCardBody>
                        </CCard>
                    </CCol>
                </CRow>
            </CContainer>
        </div>
    );
};

export default Profile;