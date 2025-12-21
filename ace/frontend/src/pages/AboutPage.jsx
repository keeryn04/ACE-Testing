import React from "react";
import "../index.css"
import { Navigate } from "react-router-dom";
import HeaderTeal from "../components/header";

const AboutPage = () => {
    return(
        <HeaderTeal>
            <h1 className='text-6xl font-bold'>AboutPage</h1>
        </HeaderTeal>

    )
}

export default AboutPage;