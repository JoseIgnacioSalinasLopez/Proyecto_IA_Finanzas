import axios from 'axios';

const test = async () => {
    try {
        const res = await axios.get('http://localhost:5000/api/activity');
        console.log('Success:', res.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.status : error.message);
        if (error.response) console.error('Data:', error.response.data);
    }
};

test();
