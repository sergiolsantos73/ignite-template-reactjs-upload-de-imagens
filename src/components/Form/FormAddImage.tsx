import { Box, Button, Stack, useToast } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { api } from '../../services/api';
import { FileInput } from '../Input/FileInput';
import { TextInput } from '../Input/TextInput';

interface FormAddImageProps {
  closeModal: () => void;
}

interface FormDataCreate {
  image: string;
  title: string;
  description: string;
}
const regexInputImageAcceptedFormats = /(?:([^:/?#]+):)?(?:([^/?#]*))?([^?#](?:jpeg|gif|png))(?:\?([^#]*))?(?:#(.*))?/g;

export function FormAddImage({ closeModal }: FormAddImageProps): JSX.Element {
  const [imageUrl, setImageUrl] = useState('');
  const [localImageUrl, setLocalImageUrl] = useState('');
  const toast = useToast();

  const formValidations = {
    image: {
      required: 'Imagem obrigatória',
      validate: {
        lessThan10MB: fileList =>
          fileList[0].size <= 10000000 || 'O arquivo deve ser menor que 10 MB',
        acceptedFormats: fileList =>
          regexInputImageAcceptedFormats.test(fileList[0].type) ||
          'Somente arquivos PNG, JPEG e GIF',
      }
    },
    title: {
      required: 'Título obrigatório',
      minLength: {
        value: 3,
        message: 'Mínimo de 3 caracteres',
      },
      maxLength: {
        value: 30,
        message: 'Máximo de 50 caracteres',
      }
    },
    description: {
      required: 'Descrição obrigatória',
      maxLength: {
        value: 80,
        message: 'Máximo de 80 caracteres',
      }
    },
  };

  const queryClient = useQueryClient();
  const mutation = useMutation(
    async (data: FormDataCreate) => {
      const newData = {
        ...data,
        url: imageUrl,
      };
      const response = await api.post('api/images', newData);

      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('images');
      }
    }
  );

  const {
    register,
    handleSubmit,
    reset,
    formState,
    setError,
    trigger,
  } = useForm();
  const { errors } = formState;

  const onSubmit = async (data: Record<string, unknown>): Promise<void> => {
    try {
      if (!imageUrl) {
        toast({
          title: 'Erro',
          description: 'Ocorreu um erro no upload da imagem',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });

        return;
      }

      await mutation.mutateAsync(data);

      toast({
        title: 'Imagem cadastrada',
        description: 'Sua imagem foi cadastrada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao tentar cadastrar a imagem',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      reset({
        image: '',
        title: '',
        description: '',
      });

      closeModal();
    }
  };

  return (
    <Box as="form" width="100%" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        <FileInput
          setImageUrl={setImageUrl}
          localImageUrl={localImageUrl}
          setLocalImageUrl={setLocalImageUrl}
          setError={setError}
          trigger={trigger}
          {...register('image', formValidations.image)}
          error={errors.image}
        />

        <TextInput
          placeholder="Título da imagem..."
          {...register('title', formValidations.title)}
          error={errors.title}
        />

        <TextInput
          placeholder="Descrição da imagem..."
          {...register('description', formValidations.description)}
          error={errors.description}
        />
      </Stack>

      <Button
        my={6}
        isLoading={formState.isSubmitting}
        isDisabled={formState.isSubmitting}
        type="submit"
        w="100%"
        py={6}
      >
        Enviar
      </Button>
    </Box>
  );
}
