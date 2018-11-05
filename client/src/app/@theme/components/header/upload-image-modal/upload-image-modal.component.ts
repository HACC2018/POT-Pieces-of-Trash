import { Component, OnInit, ViewChild, AfterViewChecked } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TrashQueryService } from '../../../../@core/data/trash-query.service';
import { UIUtilService } from '../../../../@core/data/ui-uti.servicel';

@Component({
  selector: 'ngx-upload-image',
  templateUrl: './upload-image-modal.component.html',
  styleUrls: ['./upload-image-modal.component.scss'],
})
export class UploadImageModalComponent implements OnInit, AfterViewChecked {

  @ViewChild('form') form;
  @ViewChild('select') select;
  
  selectedLocation;
  locations = [];

  locationObserverChecked = false;
  
  constructor(private activeModal: NgbActiveModal, 
              private trashQueryService: TrashQueryService,
              private uiutil: UIUtilService) {
  }

  ngOnInit() {
    this.trashQueryService.getLocations().subscribe(
      locations => this.locations = locations.data.map(location => location.location), 
      error => { });
  }

  closeModal() {
    this.activeModal.close();
  }

  sendForm() {
    const inputFile = this.form.nativeElement['image'].files[0];
    const formData: FormData = new FormData();
    formData.append('image', inputFile, inputFile.name);
    formData.append('location', this.selectedLocation);
    this.trashQueryService.submitImage(formData).subscribe(result => {
      this.closeModal();
    }, error => { });
  }

  ngAfterViewChecked() {
    if (!this.locationObserverChecked && this.select != undefined && this.select.options != undefined) {
      if (this.uiutil.patchNbSelect(this.select)) {
        this.locationObserverChecked = true;
      }
    }
  }
}