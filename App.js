import React, { useState } from 'react';
import { View, Button, Image, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AWS from 'aws-sdk';

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
    const s3 = new AWS.S3({
      region: 'ap-southeast-1',
      accessKeyId: 'AKIA6NCY64TKZUFGX7NF',
      secretAccessKey: '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',
    });

    const filename = generateFilename();
    const filePath = generateFilePath('PH');

    const params = {
      Bucket: 'direct-upload-s3-testing',
      Key: `${filePath}${filename}`,
      Expires: 60, // Presigned URL expiration time in seconds
      ContentType: response.type || 'image/jpeg',
    };

    try {
      const presignedUrl = await s3.getSignedUrlPromise('putObject', params);
      console.log(presignedUrl);
      uploadImageToS3(response, presignedUrl);
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
