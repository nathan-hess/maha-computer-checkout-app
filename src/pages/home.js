import './home.css';

import homePageImage from './mountains.jpg';


export default function Home() {
    return <>
        <h1>Maha Computer Checkout</h1>
        <br></br>
        <img
            className='home-image'
            src={homePageImage}
            alt='Landscape with mountains in the distance'
        ></img>
        <p className='home-image-source'>
            Image source:&nbsp;
            <a
                href='https://unsplash.com/photos/k5iE4N8Oxy0'
                target='_blank'
                rel='noreferrer'
            >Unsplash</a>
        </p>
        <br></br>
        <div className='home-text'>
            <p>
                Welcome!  This web app allows students, faculty, and staff at the&nbsp;
                <a
                    href='https://engineering.purdue.edu/Maha/'
                    target='_blank'
                    rel='noreferrer'
                >Maha Fluid Power Research Center</a> at&nbsp;
                <a
                    href='https://purdue.edu/'
                    target='_blank'
                    rel='noreferrer'
                >Purdue University</a> to check out shared
                computers for research work.
            </p>
        </div>
    </>;
}
