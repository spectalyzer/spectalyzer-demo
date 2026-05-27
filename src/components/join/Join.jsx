import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'
import './Join.css'

const Join = () => {
    return (
        <div className='join-section'>
            <p className='join-des'>Autistic Spectrum Analyzer - Graphical Presentation Makes It Easy</p>
            <button className='join-btn2'>JOIN NOW  <FontAwesomeIcon icon={faAngleRight} /></button>
        </div>
    );
};

export default Join;