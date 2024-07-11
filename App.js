import React, { useState } from 'react';
import { View, Button, Image, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
// import AWS from 'aws-sdk';
import axios from 'axios';

const App = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const pickImageHandler = () => {
    const options = {
      title: 'Select Image',
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error:', response.error);
      } else {
        const source = { uri: response.assets[0].uri };
        setSelectedImage(source);
        getPresignedUrl(response.assets[0]);
      }
    });
  };

  const generateFilename = () => {
    const now = new Date();
    const timestamp = now.getTime();
    return `item_${timestamp}.jpg`;
  };

  const generateFilePath = (countryCode) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `XureApp/public/images/${year}/${month}/${day}/${countryCode}/item/`;
  };

  const getPresignedUrl = async (response) => {
    const endpoint = "https://bzsaxp4bqh.execute-api.ap-southeast-1.amazonaws.com/default/test-getpresignedURL"
    const filename = generateFilename();
    const filePath = generateFilePath('PH');

    const params = {
      key: `${filePath}${filename}`
    };

    try {
      const presignedUrl = await axios.post(endpoint, params);
      console.log(presignedUrl.data);
      uploadImageToS3(response, presignedUrl.data);
    } catch (error) {
      console.log('Error getting presigned URL:', error);
      Alert.alert('Upload Failed', 'Error getting presigned URL');
    }
  };

  const uploadImageToS3 = async (response, presignedUrl) => {
    try {
      const res = await fetch(presignedUrl, {
        method: "PUT",
        body: response,
        headers: {
          'Content-Type': 'image/jpeg',
        }
      })
      console.log(JSON.stringify(res));
      Alert.alert('Upload Success', 'Image uploaded successfully');
    } catch (error) {
      console.log('Error uploading to S3:', error);
      Alert.alert('Upload Failed', 'Error uploading image');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Pick Image" onPress={pickImageHandler} />
      {selectedImage && (
        <Image source={selectedImage} style={{ width: 300, height: 300, marginTop: 20 }} />
      )}
    </View>
  );
};

export default App;
