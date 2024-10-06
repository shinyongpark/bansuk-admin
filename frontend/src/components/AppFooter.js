import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <a href="https://bansuksports.com/" target="_blank" rel="noopener noreferrer">
          반석스포츠 쇼핑몰 웹사이트
        </a>
      </div>
      <div className="ms-auto">
        <span className="me-1">Last Update: 2024/10/06</span>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
