import os
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset
from Bio import SeqIO
import time
from torch.utils.data import random_split
import logging
import sys
import copy
from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns
import matplotlib.pyplot as plt
import io


# Hyperparameters
train_size_percentage = 0.75
val_size_percentage   = 0.15
# test size = train - val
num_epochs = 70
lr = 0.001


# Create a logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create a file handler
handler = logging.FileHandler('training.log')
handler.setLevel(logging.INFO)

# Create a stream handler for output to console
consoleHandler = logging.StreamHandler()
consoleHandler.setLevel(logging.INFO)

# Create a logging format
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
consoleHandler.setFormatter(formatter)

# Add the handlers to the logger
logger.addHandler(handler)         # For file output
logger.addHandler(consoleHandler)  # For console output


def calculate_metrics(preds, labels, label_names):
    # confusion matrix
    # cm = confusion_matrix(labels, preds)
    # plt.figure(figsize=(12, 10))
    # sns.heatmap(cm, annot=True, fmt='d')
    # plt.title('Confusion Matrix')
    # plt.xlabel('Predicted Label')
    # plt.ylabel('True Label')
    # plt.show()

    # precision, recall, F1-score
    buffer = io.StringIO()  # Create a buffer
    print(classification_report(labels, preds, target_names=label_names), file=buffer)  # Redirect print to buffer
    logger.info("Classification report:\n %s", buffer.getvalue())               # Get value from buffer and log it


def evaluate_model(model, dataloader):
    model.eval()
    all_preds = []
    all_labels = []
    with torch.no_grad():
        for sequences, labels in dataloader:
            sequences = sequences.to(device)
            labels = labels.to(device)
            outputs = model(sequences)
            _, preds = torch.max(outputs.data, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    return all_preds, all_labels


def encode_sequence(sequence):
    mapping = {'A': 0, 'C': 1, 'G': 2, 'T': 3, 'N': 4}
    sequence = sequence.upper()
    sequence = ''.join(['N' if nucleotide not in mapping else nucleotide for nucleotide in sequence])
    return [mapping[i] for i in sequence]

def pad_sequence(encoded_sequence, max_length=30000):
    if len(encoded_sequence) < max_length:
        return encoded_sequence + [4] * (max_length - len(encoded_sequence))
    else:
        return encoded_sequence[:max_length]

def preprocess_data(sequences):
    max_length = max(len(sequence) for sequence in sequences)
    print(f'Max length: {max_length}')
    encoded_sequences = []
    for sequence in sequences:
        encoded_sequence = encode_sequence(sequence)
        padded_sequence = pad_sequence(encoded_sequence, max_length)
        encoded_sequences.append(padded_sequence)
    return encoded_sequences

class CNN(nn.Module):
    def __init__(self):
        super(CNN, self).__init__()
        self.conv1 = nn.Conv1d(1, 128, kernel_size=5)
        self.conv2 = nn.Conv1d(128, 256, kernel_size=5)
        self.fc1 = nn.Linear(256*7489, 12)  # initial value
        self.counter = 0  # Initialize counter to count the number of forward passes


    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = F.max_pool1d(x, 2)
        x = F.relu(self.conv2(x))
        x = F.max_pool1d(x, 2)
        # print(x.shape)  # print out the shape before reshaping and fully connected layer
        print(f'Forward pass: {self.counter}')  # print out the number of forward passes
        self.counter += 1
        x = x.view(x.size(0), -1)
        x = self.fc1(x)
        return F.log_softmax(x, dim=1)


# Set up logging
logging.basicConfig(filename='training.log', level=logging.INFO)


# Modify train_model function
def train_model(model, criterion, optimizer, train_dataloader, val_dataloader, num_epochs=25):
    start_epoch = 0
    best_acc = 0.0

    if os.path.exists('checkpoint.pt'):
        checkpoint = torch.load('checkpoint.pt')
        model.load_state_dict(checkpoint['model_state_dict'])
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        start_epoch = checkpoint['epoch']
        logger.info("Resuming training from epoch: %s", start_epoch)

    for epoch in range(start_epoch, num_epochs):
        start_time = time.time()
        logger.info('Epoch {}/{}'.format(epoch, num_epochs - 1))
        logger.info('-' * 10)

        # Each epoch has a training and validation phase
        for phase in ['train', 'val']:
            if phase == 'train':
                dataloader = train_dataloader
                model.train()  # Set model to training mode
            else:
                dataloader = val_dataloader
                model.eval()  # Set model to evaluate mode

            running_loss = 0.0
            running_corrects = 0

            # Iterate over data.
            for inputs, labels in dataloader:
                inputs = inputs.to(device)
                labels = labels.to(device)

                # zero the parameter gradients
                optimizer.zero_grad()

                # forward
                # track history if only in train
                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    # backward + optimize only if in training phase
                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                # statistics
                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            epoch_loss = running_loss / len(dataloader.dataset)
            epoch_acc = running_corrects.double() / len(dataloader.dataset)

            logger.info(
                '{} Epoch: {}/{} Loss: {:.4f} Acc: {:.4f}'.format(phase, epoch, num_epochs - 1, epoch_loss, epoch_acc))

            end_time = time.time()
            logger.info('{} Epoch time: {:.2f} seconds'.format(phase, (end_time - start_time)))

            # deep copy the model
            if phase == 'val' and epoch_acc > best_acc:
                best_acc = epoch_acc
                best_model_wts = copy.deepcopy(model.state_dict())

            torch.save({
                'epoch': epoch + 1,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
            }, 'checkpoint.pt')

    return model


# Load and preprocess data
sequences, labels = [], []
for i in range(1, 13):
    file_sequences = [] # Initialize an empty list to store the sequences from the current file
    for record in SeqIO.parse(f'D:\\PythonProjects\\Computers\\ClassifyLineages\\Samples\\lineage{i}.fasta', 'fasta'):
        file_sequences.append(str(record.seq)) # Add the current sequence to the list
        labels.append(i - 1)
    print(f'Loaded {len(file_sequences)} sequences from lineage{i}.fasta') # Print the number of sequences loaded from the current file
    sequences.extend(file_sequences) # Add the sequences from the current file to the main sequences list

sequences = preprocess_data(sequences)
encoded_sequences = torch.tensor(sequences, dtype=torch.float32).unsqueeze(1)
labels = torch.tensor(labels, dtype=torch.long)

# Create dataloader
dataset = TensorDataset(encoded_sequences, labels)


# Split the dataset into train, validation and test sets
train_size = int(train_size_percentage * len(dataset))
val_size = int(val_size_percentage * len(dataset))
test_size = len(dataset) - train_size - val_size
train_dataset, val_dataset, test_dataset = random_split(dataset, [train_size, val_size, test_size])

# Create separate dataloaders for training, validation and testing
train_dataloader = DataLoader(train_dataset, batch_size=64, shuffle=True)
val_dataloader = DataLoader(val_dataset, batch_size=64, shuffle=True)
test_dataloader = DataLoader(test_dataset, batch_size=64, shuffle=True)


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# Initialize model, loss, optimizer
model = CNN().to(device)
criterion = nn.NLLLoss()
optimizer = optim.SGD(model.parameters(), lr)

# Train model
start_time = time.time()  # start time of the training
model = train_model(model, criterion, optimizer, train_dataloader, val_dataloader, num_epochs)
end_time = time.time()  # end time of the training

print("Training complete.")
logger.info('Total training time: %.2f seconds', (end_time - start_time))  # print total training time
label_names = [f'lineage {i+1}' for i in range(12)]  # class names

# after training
test_preds, test_labels = evaluate_model(model, test_dataloader)
calculate_metrics(test_preds, test_labels, label_names)

val_preds, val_labels = evaluate_model(model, val_dataloader)
calculate_metrics(val_preds, val_labels, label_names)

# Calculate validation accuracy
correct_val = sum([pred == label for pred, label in zip(val_preds, val_labels)])
validation_accuracy = correct_val / len(val_labels) * 100

logger.info('Validation Accuracy of the model on the validation sequences: {:.2f}%'.format(validation_accuracy))


# Test the model
model.eval()           # set the model to evaluation mode
with torch.no_grad():  # turn off gradients for the testing phase
    correct = 0
    total = 0
    for sequences, labels in test_dataloader:
        sequences = sequences.to(device)
        labels = labels.to(device)
        outputs = model(sequences)
        _, predicted = torch.max(outputs.data, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()
    logger.info('Test Accuracy of the model on the test sequences: {:.2f}%'.format(100 * correct / total))
