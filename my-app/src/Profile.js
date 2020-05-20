import React ,  {Component} from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import Select from 'react-select';
import 'bootstrap/dist/css/bootstrap.css';

const genreOptions = [
    { value: 'Action', label: 'Action' },
    { value: 'Thriller', label: 'Thriller' },
    { value: 'Drama', label: 'Drama' },
    { value: 'Comedy', label: 'Comedy' },
    { value: 'Sci-fi', label: 'Sci-fi' },
    { value: 'Crime', label: 'Crime' },
    { value: 'Romantic', label: 'Romantic' } 
  ]; //our array of genre

const token = localStorage.getItem('token');

export default class Profile extends Component {
    constructor(props) {
        super(props);
        this.state = {
          selectedOption: [], 
        }
    }
    handleChange = (selectedOption) => {
        this.setState({ selectedOption });
      }
    onSubmit = (event) =>{
        event.preventDefault();
        const genre= 
            this.state.selectedOption;
            console.log(JSON.stringify(genre));
    
        fetch(`http://localhost:5000/saveuserdetails`, {
        method: 'POST',
        body: JSON.stringify(genre),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        }
        })
        .then(res => {
            if (res.status == 200){
                alert("Profile Changes Saved");
                this.props.history.push('/');
            } }       
        )
        .catch(err =>{   
        console.error(err);
        }); 
    }
  render(){
    return (
    <div>
        <div class = 'container'>
        <a>Select Genre</a>
            <Select
            className="mt-4 col-md-6 col-offset-4"
            isMulti
            options={genreOptions}
            onChange={this.handleChange}
            />
        </div>
        <div>
        <button className="btn btn-outline-dark my-2 my-sm-0" onClick = {this.onSubmit}>Save</button>
        </div>
    </div>   
    );
  }
}

